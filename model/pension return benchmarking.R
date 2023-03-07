library(tidyverse)
# library(reasontheme)
library(readxl)
library(plotly)
library(formattable)
library(scales)
library(lubridate)
library(quantmod)
library(quadprog)
library(rio)
library(parallel)
library(ggbeeswarm)
library(echarts4r)
library(packcircles)
library(ggrepel)
library(dplyr)
library(ggplot2)

#########Data prep

# Read pension data & index returns data

ppd_full <- read.csv("ppd-data-latest.csv")
bb_index_returns <- read_xlsx("BB.xlsx", sheet="Input")
colnames(bb_index_returns) <- c("fy", "month", "acwi_ex_us_tr", "ru30_tr", "bb_us_agg_tr")

custom_portfolios <- read_xlsx("BB.xlsx", sheet="Custom Portfolio")
conservative_port <- custom_portfolios$Conservative
moderate_port <- custom_portfolios$Moderate
aggressive_port <- custom_portfolios$Aggressive
standard_pension_port <- custom_portfolios$`Public pension`

#Function to find mode
mode <- function(x) {
  ux <- unique(x)
  ux[which.max(tabulate(match(x, ux)))]
}

#Function to calculate average returns
geo_return <- function(x, na.rm = F) {
  if (na.rm == T) {
    x = na.omit(x)
  }
  avg_return <- prod(1+x)^(1/length(x)) - 1
  return(avg_return)
}


#Specify start and end year
start_fy <- 2001
end_fy <- 2021
max_range <- end_fy - start_fy + 1

#Filter and clean PPD data
ppd <- ppd_full %>% 
  mutate(PlanFullName = gsub("\x92", "'", PlanFullName),    #clean plan names and full names
         PlanName = gsub("\x92", "'", PlanName)) %>% 
  filter(AdministeringGovt == 0, fy >= start_fy, fy <= end_fy) %>% #select state plans only and get data within a specified range
  select(fy, fye, PlanName, PlanFullName, StateName, ActLiabilities_GASB, MktAssets_net,
         InvestmentReturnAssumption_GASB, InvestmentReturn_1yr) %>%
  rename(plan_name = PlanName,            #rename columns for easier reference
         plan_full_name = PlanFullName,
         state = StateName,
         aal = ActLiabilities_GASB,
         mva = MktAssets_net,
         arr = InvestmentReturnAssumption_GASB,
         return = InvestmentReturn_1yr) %>%
  mutate(
         return = as.numeric(return),
         fye = ymd(fye),
         month = month(fye), .after = fye) %>%
  drop_na(return) %>%
  group_by(plan_name) %>%
  filter(n() == max_range) #filter out Penn Municipal because there are only 20 obs


# fix errors in data of Wisconsin RS
ppd[ppd$plan_name == 'Wisconsin RS',]$month <- replace(ppd[ppd$plan_name == 'Wisconsin RS',]$month, 21, 12)


#Choose number of years to perform the analysis
period_input = 20    #note that this period should not exceed the max range specified earlier

period_final = min(period_input, max_range)

ppd_select <- ppd %>% filter(fy >= end_fy - period_final + 1)

#Identify plans with n/a returns in any year of the selected period and filter them out
ppd_na <- ppd_select %>% filter(is.na(return))

ppd_select <- ppd_select %>% 
  anti_join(ppd_na, by = "plan_name")

#Join benchmark return data
ppd_select <- ppd_select %>% 
  # left_join(index_returns, by = c("fy", "month")) %>%
  left_join(bb_index_returns, by=c("fy", "month"))

#Function to calculate the optimal benchmark portfolio
benchmark_portfolio <- function(return, x1, x2, x3) {
  x0 <- 1                                     #for the intercept (alpha)
  x = cbind(x0, x1, x2, x3)
  
  Dmat <- crossprod(x)
  dvec <- crossprod(return, x)                  # vector to be minimized: product:transpose return and x
  Amat <- t(cbind(0, rbind(rep(1,3), diag(3))))   # matrix defining the constraints
  bvec <- c(1,0,0,0)                              # vector of b coefficient; meq = 1 is equality constraint: coefs sum to 1  
  
  result <- solve.QP(Dmat = Dmat, dvec = dvec, Amat = Amat, bvec = bvec, meq = 1) 
  
  return(list(result$solution))
}


calculate_weighted_return <- function(weights, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr){
  vector_return <- c(acwi_ex_us_tr, ru30_tr, bb_us_agg_tr)
  weighted_return <- weights[1]*acwi_ex_us_tr + weights[2]*ru30_tr + weights[3]*bb_us_agg_tr
  return(weighted_return)
}

#Calculate cumulative returns and excess cumulative returns
ppd_cum_returns <- ppd_select %>% 
  group_by(plan_name) %>% 
  mutate(
         opt_benchmark = benchmark_portfolio(return, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr),
         opt_benchmark_return = opt_benchmark[[1]][2]*acwi_ex_us_tr + opt_benchmark[[1]][3]*ru30_tr + opt_benchmark[[1]][4]*bb_us_agg_tr,
         # custom_benchmark_return = non_us_equity_w * acwi_ex_us_tr + us_equity_w * ru30_tr + us_bond_w * bb_us_agg_tr,
         conservative_benchmark_return = calculate_weighted_return(conservative_port, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr),
         moderate_benchmark_return = calculate_weighted_return(moderate_port, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr),
         aggressive_benchmark_return = calculate_weighted_return(aggressive_port, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr),
         standard_pension_benchmark_return = calculate_weighted_return(standard_pension_port, acwi_ex_us_tr, ru30_tr, bb_us_agg_tr),
         across(c(return, opt_benchmark_return, conservative_benchmark_return,
                  moderate_benchmark_return, aggressive_benchmark_return, standard_pension_benchmark_return), ~ cumprod(1+ .x), .names = "cum_{.col}")) %>%      #calculate cumulative returns across three variables
  group_modify(~ add_row(.x, .before = 0)) %>%                            #add one row before the first fy for each plan
  mutate(fy = ifelse(is.na(fy), min(fy, na.rm = T) - 1, fy),              #add the "base" fy 
         across(starts_with("cum"), ~ ifelse(is.na(.x), 1, .x)),          #add 1 as the starting point of the cumulative return series
         across(plan_full_name:state, ~ifelse(is.na(.x), mode(.x), .x)),   #fill in plan names and state names for the added rows
         cum_opt_benchmark_excess = cum_return - cum_opt_benchmark_return,
         cum_conservative_benchmark_excess = cum_return - cum_conservative_benchmark_return,
         cum_moderate_benchmark_excess = cum_return - cum_moderate_benchmark_return,
         cum_aggressive_benchmark_excess = cum_return - cum_aggressive_benchmark_return,
         cum_standard_pension_benchmark_excess = cum_return - cum_standard_pension_benchmark_return
  ) %>% 
  ungroup()


#Calculate average geometric returns and excess average returns
ppd_avg_returns <- ppd_cum_returns %>%
  group_by(plan_name) %>%
  summarise(across(c(return, opt_benchmark_return, conservative_benchmark_return,
                     moderate_benchmark_return, aggressive_benchmark_return, standard_pension_benchmark_return),
                   ~ geo_return(.x, na.rm = T), .names = "avg_{.col}")) %>% 
  ungroup() %>% 
  mutate(avg_opt_benchmark_excess = avg_return - avg_opt_benchmark_return,
         avg_conservative_benchmark_excess = avg_return - avg_conservative_benchmark_return,
         avg_moderate_benchmark_excess = avg_return - avg_moderate_benchmark_return,
         avg_aggressive_benchmark_excess = avg_return - avg_aggressive_benchmark_return,
         avg_standard_pension_benchmark_excess = avg_return - avg_standard_pension_benchmark_return)
  


#Get 2021 AALs to map to the size of visualized dots
ppd_avg_returns_final <- ppd_select %>%
  filter(fy == 2021, !is.na(aal)) %>%
  select(fy:aal) %>%
  left_join(ppd_avg_returns)


#Select the target plan and the benchmark type
# target_plan <- "Arizona SRS"
# benchmark_type <- "Empirical Benchmark"
# 
write.csv(ppd_cum_returns[, !names(ppd_cum_returns) %in% c("opt_benchmark")],
          "./../data/20 years/cumReturn_20Yr.csv", row.names=F)
write.csv(ppd_avg_returns_final, "./../data/20 years/avgReturn_20Yr.csv")


#########Visualization

#Visualize cumulative returns of the target plan
# ppd_cum_returns_plan <- ppd_cum_returns %>%
#   filter(plan_name == target_plan) %>%
#   select(plan_name, plan_full_name, fy, cum_return, cum_opt_benchmark_return, cum_custom_benchmark_return) %>%
#   pivot_longer(cols = cum_return:cum_custom_benchmark_return,
#                names_to = "cum_return_type",
#                values_to = "value") %>%
#   mutate(cum_return_type = case_when(
#     cum_return_type == "cum_return" ~ target_plan,
#     cum_return_type == "cum_opt_benchmark_return" ~ "Empirical Benchmark",
#     cum_return_type == "cum_custom_benchmark_return" ~ "Custom Benchmark"
#   )) %>%
#   filter(if (benchmark_type == "Empirical Benchmark") cum_return_type != "Custom Benchmark" else cum_return_type != "Empirical Benchmark")
# 
# 
# ggplot(ppd_cum_returns_plan, aes(x = fy, y = value, col = cum_return_type)) +
#   geom_line() +
#   geom_text_repel(data = ppd_cum_returns_plan %>% filter(fy == end_fy),    #Annotate the two lines
#                   aes(label = cum_return_type),
#                   nudge_x = 0.5,
#                   segment.color = NA) +
#   scale_color_manual(values = c("orange", "#0E86D4"),
#                      breaks = c(target_plan, benchmark_type)) +
#   scale_x_continuous(breaks = (end_fy - period_final):end_fy,
#                      expand = expansion(mult = c(0, 0.3))) +
#   scale_y_continuous(breaks = pretty_breaks(n = 10)) +
#   labs(x = NULL, y = NULL,
#        title = paste0("Cumulative Returns", " (", end_fy - period_final + 1, " - ", end_fy, ")",
#                       " - ", target_plan)) +
#   theme_classic() +
#   theme(axis.line.y = element_blank(),
#         panel.grid.major.y = element_line(size = 0.3),
#         legend.position = "none")


#Visualize average returns of the target plan
# ppd_avg_returns_final_plan <- ppd_avg_returns_final %>%
#   filter(plan_name == target_plan) %>%
#   select(plan_name, plan_full_name, fy, avg_return, avg_opt_benchmark_return, avg_custom_benchmark_return) %>%
#   pivot_longer(cols = avg_return:avg_custom_benchmark_return,
#                names_to = "avg_return_type",
#                values_to = "value") %>%
#   mutate(avg_return_type = case_when(
#     avg_return_type == "avg_return" ~ target_plan,
#     avg_return_type == "avg_opt_benchmark_return" ~ "Empirical Benchmark",
#     avg_return_type == "avg_custom_benchmark_return" ~ "Custom Benchmark"
#   )) %>%
#   filter(if (benchmark_type == "Empirical Benchmark") avg_return_type != "Custom Benchmark" else avg_return_type != "Empirical Benchmark")
# 
# 
# ggplot(ppd_avg_returns_final_plan, aes(x = value, y = 0, col = avg_return_type)) +
#   geom_point() +
#   scale_x_continuous(labels = percent_format(),
#                      limits = c(min(ppd_avg_returns_final_plan$value) - 0.02,
#                                 max(ppd_avg_returns_final_plan$value + 0.02))) +
#   scale_y_continuous(expand = expansion(mult = c(0,0)),
#                      limits = c(0,0.5)) +
#   theme_classic() +
#   theme(axis.line.y = element_blank(),
#         axis.text.y = element_blank(),
#         axis.title = element_blank(),
#         axis.ticks.y = element_blank(),
#         legend.position = "none")


#Visualize cumulative excess returns
# ppd_cum_returns <- ppd_cum_returns %>%
#   mutate(target = ifelse(plan_name == target_plan, plan_name, "Others"))



# ggplot(ppd_cum_returns, aes(x = fy,
#                             y = if (benchmark_type == "Empirical Benchmark") cum_opt_benchmark_excess else cum_custom_benchmark_excess,
#                             group = plan_name)) +
#   geom_line(aes(col = target, alpha = target, size = target)) +
#   geom_line(data = ppd_cum_returns %>% filter(plan_name == target_plan),
#             col = "orange",
#             size = 1) +
#   geom_segment(aes(x = end_fy - period_final, y = 0, xend = end_fy, yend = 0),
#                col = "black",
#                linetype = "dashed") +
#   scale_y_continuous(labels = percent_format(),
#                      breaks = pretty_breaks(n = 7)) +
#   scale_x_continuous(breaks = (end_fy - period_final):end_fy,
#                      expand = expansion(mult = c(0, 0.05))) +
#   scale_color_manual(values = c("orange", "gray"),
#                      breaks = c(target_plan, "Others")) +
#   scale_alpha_manual(values = c(1, 0.4),
#                      breaks = c(target_plan, "Others")) +
#   scale_size_manual(values = c(1, 0.5),
#                     breaks = c(target_plan, "Others")) +
#   labs(x = NULL, y = NULL,
#        title = paste0("Cumulative Exccess Returns", " (", end_fy - period_final + 1, " - ", end_fy, ")"),
#        subtitle = benchmark_type) +
#   theme_classic() +
#   theme(legend.title = element_blank())

# ggplotly(p)


#Visualize geometric average excess returns
# ppd_avg_returns_final <- ppd_avg_returns_final %>%
#   mutate(x_group = "group",
#          target = ifelse(plan_name == target_plan, plan_name, "Others"))
# 
# ggplot(ppd_avg_returns_final, aes(x = if (benchmark_type == "Empirical Benchmark") avg_opt_benchmark_excess else avg_custom_benchmark_excess,
#                                   y = x_group)) +
#   geom_quasirandom(groupOnX = F, aes(size = aal, col = target, alpha = target)) +
#   geom_vline(xintercept = 0, linetype = "dashed") +
#   scale_x_continuous(labels = percent_format(),
#                      breaks = pretty_breaks(n = 6)) +
#   scale_size_continuous(range = c(2,16)) +
#   scale_color_manual(values = c("orange", "gray"),
#                      breaks = c(target_plan, "Others")) +
#   scale_alpha_manual(values = c(1, 0.7),
#                      breaks = c(target_plan, "Others")) +
#   guides(size = "none") +
#   labs(x = NULL, y = NULL,
#        title = paste0("Average Excess Returns", " (", end_fy - period_final + 1, " - ", end_fy, ")")) +
#   theme_classic() +
#   theme(axis.text.y = element_blank(),
#         axis.line.y = element_blank(),
#         axis.ticks.y = element_blank(),
#         legend.title = element_blank())



# oldbee_chart_data <- ggplot_build(beeswarm_without_size)
# 
# newbee_frame <- data.frame(x = oldbee_chart_data$data[[1]]$x,
#                            y = oldbee_chart_data$data[[1]]$y,
#                            r = ppd_avg_returns_final$aal/100000000)
# 
# newbee_repel <- circleRepelLayout(newbee_frame, wrap = F)
# 
# newbee_repel_out <- circleLayoutVertices(newbee_repel$layout, xysizecols = 1:3)
# 
# ggplot(newbee_repel_out, aes(x, y, group = id)) +
#   geom_polygon() +
#   coord_equal()


