
function drawCumReturns_(
    data,
    dimensions,
    plan,
    benchmark,
    bound,
    wrapper,
    tooltip,
    dot
){
    // Access data
    const subDataset = data.filter(d => d.plan_name === plan)

    const actualReturnAccessor = d => parseFloat(d.cum_return)
    const yearAccessor = d => parseInt(d.fy)

    const xtickValues = (d3.range(d3.min(subDataset, yearAccessor),
                        d3.max(subDataset, yearAccessor) + 1, 1))

    let benchmarkReturnAccessor
    if(benchmark === 'Optimal benchmark'){
        benchmarkReturnAccessor =  d => parseFloat(d.cum_opt_benchmark_return)
    } else {
        benchmarkReturnAccessor = d => parseFloat(d.cum_custom_benchmark_return)
    }

    const yearValue = d3.map(subDataset, yearAccessor)
    const actualReturnValue = d3.map(subDataset, actualReturnAccessor)
    const benchmarkReturnValue = d3.map(subDataset, benchmarkReturnAccessor)
    const I = d3.map(subDataset, (_, i) => i)
    const O = d3.map(subDataset, d => d);

    // Create scales
    const xDomain = d3.extent(subDataset, yearAccessor)
    const yDomain = [d3.min(actualReturnValue.concat(benchmarkReturnValue)),
                    d3.max(actualReturnValue.concat(benchmarkReturnValue))]


    const xTickValues = d3.range(d3.min(subDataset, yearAccessor),
                        d3.max(subDataset, yearAccessor) + 1, 1)

    const yTickValues = d3.range(d3.min(subDataset, actualReturnAccessor),
                        d3.max(subDataset, actualReturnAccessor), 0.2)

    const xType = d3.scaleLinear
    const xRange = [0, dimensions.boundedWidth]
    const yType = d3.scaleLinear
    const yRange = [dimensions.boundedHeight, 0]


    const yFormat = d3.format(".1f")
    const xScale = xType(xDomain, xRange)
    const yScale = yType(yDomain, yRange).nice()


    // Draw canvas
    const curve = d3.curveLinear
    const line_actualReturn = d3.line()
        .curve(curve)
        .x(i => xScale(yearValue[i]))
        .y(i => yScale(actualReturnValue[i]))


    const line_benchmarkReturn = d3.line()
        .curve(curve)
        .x(i => xScale(yearValue[i]))
        .y(i => yScale(benchmarkReturnValue[i]))

    const color = "steelblue"
    const strokeWidth = 1.5
    const strokeLinejoin = "round"
    const strokeLinecap = "round"

    bound.select(".pathActualReturn")
        .selectAll("path")
        .data([I])
        .join("path")
        .transition().duration(500)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-linecap", strokeLinecap)
        .attr("d", line_actualReturn);

    bound.select(".pathBenchmarkReturn")
        .selectAll("path")
        .data([I])
        .join("path")
        .transition().duration(500)
        .attr("fill", "none")
        .attr("stroke", "maroon")
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-linecap", strokeLinecap)
        .attr("d", line_benchmarkReturn);

    // Draw peripherals
    const xAxis = d3.axisBottom(xScale).tickValues(xTickValues).tickFormat(d3.format(".0f"))
    const yAxis = d3.axisLeft(yScale)
                // .tickValues(yTickValues)
                .tickFormat(yFormat)
    bound.select(".x-axis").call(xAxis)

    bound.select(".y-axis").call(yAxis)

    bound.select(".title")
        .attr("x", dimensions.width / 2)
        .attr("y", -dimensions.margin.top / 2)
        .style("font-size", "16px")
        .attr("font-weight", 700)
        .attr("text-anchor", "middle")
        .text("Cumulative return")

    // Set up interaction

    wrapper
        .on("pointerenter pointermove", pointermoved)
        .on("pointerleave", pointerleft)
        .on("touchstart", event => event.preventDefault())

    const combinedReturn = actualReturnValue.concat(benchmarkReturnValue)
    const combinedYear = yearValue.concat(yearValue)
    const I_comb = d3.range(combinedReturn.length)

    const xmRange = [dimensions.margin.left, dimensions.width - dimensions.margin.right]
    const ymRange = [dimensions.height - dimensions.margin.bottom, dimensions.margin.top]

    const xmScale = xType(xDomain, xmRange)
    const ymScale = yType(yDomain, ymRange)

    const title = i => `${combinedYear[i]}\n${yFormat(combinedReturn[i])}`
    function pointermoved(event) {
        const [xm, ym] = d3.pointer(event)
        const j = d3.least(I_comb, i => Math.hypot(xmScale(combinedYear[i]) - xm, ymScale(combinedReturn[i]) - ym))
        tooltip.style("display", null);
        tooltip.attr("transform", `translate(${xScale(combinedYear[j])},${yScale(combinedReturn[j]) })`);
        dot.style("display", null)
        dot.attr("transform", `translate(${xScale(combinedYear[j])},${yScale(combinedReturn[j]) })`);
    
        const path = tooltip.selectAll("path")
            .data([,])
            .join("path")
            .attr("fill", "white")
            .attr("stroke", "black");
    
        const text = tooltip.selectAll("text")
            .data([,])
            .join("text")
            .call(text => text
            .selectAll("tspan")
            .data(`${title(j)}`.split(/\n/))
            .join("tspan")
                .attr("x", 0)
                .attr("y", (_, i) => `${i * 1.1}em`)
                .attr("font-weight", (_, i) => i ? null : "bold")
                .text(d => d));
    
        }

    function pointerleft() {
        tooltip.style("display", "none");
        dot.style("display", "none");
        }
}

export {drawCumReturns_}