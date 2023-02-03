function drawAvgReturn_(data, dimensions, plan, benchmark, period) {
  const subDataset = data.filter((d) => d.plan_name === plan);

  let benchmarkReturnAccessor;
  if (benchmark === "Optimal portfolio") {
    benchmarkReturnAccessor = (d) => parseFloat(d.avg_opt_benchmark_return);
  } else if (benchmark == "Standard portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_standard_pension_benchmark_return);
  } else if (benchmark == "Moderate portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_moderate_benchmark_return);
  } else if (benchmark == "Aggressive portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_aggressive_benchmark_return);
  } else if (benchmark == "Conservative portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_conservative_benchmark_return);
  }

  const actualReturnAccessor = (d) => parseFloat(d.avg_return);

  const actualReturnValue = d3.map(subDataset, actualReturnAccessor);
  const benchmarkReturnValue = d3.map(subDataset, benchmarkReturnAccessor);

  const numberFormat = d3.format(".2%");

  d3.select("#period").text(period);
  d3.select("#plan").text(plan);
  d3.select("#planReturn").text(numberFormat(actualReturnValue));
  d3.select("#benchmarkReturn").text(numberFormat(benchmarkReturnValue));
}

export { drawAvgReturn_ };
