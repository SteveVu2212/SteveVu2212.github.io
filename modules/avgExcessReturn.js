function drawAvgExcessReturn_(
  data,
  dimensions,
  plan,
  benchmark,
  bound,
  legend,
  tooltip
) {
  const yearAccessor = (d) => parseInt(d.fy);
  const aalAccessor = (d) => parseFloat(d.aal);
  const percentFormat = d3.format(".1%");

  let benchmarkReturnAccessor;
  if (benchmark === "Empirical portfolio") {
    benchmarkReturnAccessor = (d) => parseFloat(d.avg_opt_benchmark_excess);
  } else if (benchmark == "Standard portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_standard_pension_benchmark_excess);
  } else if (benchmark == "Moderate portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_moderate_benchmark_excess);
  } else if (benchmark == "Aggressive portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_aggressive_benchmark_excess);
  } else if (benchmark == "Conservative portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.avg_conservative_benchmark_excess);
  }

  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(data, aalAccessor))
    .range([0, 30]);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, benchmarkReturnAccessor))
    // .domain([-0.15,0.1])
    .range([0, 0.9 * dimensions.boundedWidth])
    .nice();

  // Create nodes for each data points
  let nodes = data.map(function (d, i) {
    return {
      id: "node" + i,
      x: xScale(benchmarkReturnAccessor(d)),
      y: dimensions.boundedHeight / 2,
      r: rScale(aalAccessor(d)),
      rate: benchmarkReturnAccessor(d),
      cnt: aalAccessor(d),
      planName: d.plan_name,
      data: d,
    };
  });

  const bubble_avgExcessReturn = bound
    .select(".bubbleAvgExcessReturn")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    // .attr("cx", d => d.x)
    // .attr("cy", d => d.y)
    .attr("id", (d) => "circle" + d.id)
    .attr("r", (d) => d.r)
    .style("fill", (d) => (d.planName === plan ? "#f63" : "#2879cb"))
    .attr("fill-opacity", (d) => (d.planName === plan ? 1 : 0.2))
    .on("mouseover", function (e, d) {
      tooltip.html(d.planName + "<br/>" + percentFormat(d.rate));
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (e, d) {
      return tooltip
        .style("top", e.pageY - 100 + "px")
        .style("left", e.pageX - 200 + "px");
    })
    .on("mouseout", function () {
      return tooltip.style("visibility", "hidden");
    });

  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(1))
    .force(
      "x",
      d3.forceX((d) => d.x)
    )
    .force("y", d3.forceY(dimensions.boundedWidth / 5))
    .force(
      "collision",
      d3
        .forceCollide()
        .strength(2)
        .radius((d) => d.r + dimensions.padding)
    );
  // .alpha(0.01)
  // .alphaDecay(0);

  simulation.on("tick", () => {
    bubble_avgExcessReturn
      .transition()
      .delay((d, i) => i * 2)
      .duration(100)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  });

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat((d) => percentFormat(d))
    .tickSize(8)
    .tickPadding(5);

  const xAxisEl = bound
    .select(".x-axis")
    .call(xAxis)
    .style("color", "rgb(129, 129, 129)")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .attr("stroke-opacity", 0.5);

  bound
    .select(".x-axis")
    .selectAll(".tick text")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .style("color", "rgb(129, 129, 129)")
    .style("font-family", "'Open Sans', sans-serif");


  const zeroLine = bound
    .select(".zeroLine")
    .transition()
    .duration(1000)
    .attr("x1", xScale(0))
    .attr("x2", xScale(0))
    .attr("y1", dimensions.height * 0.85)
    .attr("y2", dimensions.height * 0.1)
    .style("stroke", "black")
    .style("stroke-dasharray", "2px 4px")
    .attr("stroke-opacity", 0.5);

  legend
    .selectAll(".ind")
    .data([50000000, 250000000, 500000000])
    .join("circle")
    .attr("class", "ind")
    .attr("r", (d) => rScale(d))
    .attr("cx", 80)
    .attr("cy", (d) => 90 - rScale(d))
    .style("fill", "none")
    .style("stroke", "#ccc");

  legend
    .selectAll(".leglabel")
    .data([50000000, 250000000, 500000000])
    .join("text")
    .attr("class", "leglabel")
    .attr("x", 80)
    .attr("y", (d) => 90 - rScale(d) * 2)
    .attr("dy", -4)
    .text((d) => d3.format(",")(d / 1000000) + "mn")
    .style("font-size", ".6rem")
    .style("text-anchor", "middle");
}

export { drawAvgExcessReturn_ };
