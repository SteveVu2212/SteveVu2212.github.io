function drawExcessReturn_(
  data,
  dimensions,
  plan,
  benchmark,
  bound,
  wrapper,
  dot
) {
  // Access data
  const x = (d) => parseInt(d.fy);
  const z = (d) => d.plan_name;

  let y;
  if (benchmark === "Empirical portfolio") {
    y = (d) => parseFloat(d.cum_opt_benchmark_excess);
  } else if (benchmark == "Standard portfolio") {
    y = (d) => parseFloat(d.cum_standard_pension_benchmark_excess);
  } else if (benchmark == "Moderate portfolio") {
    y = (d) => parseFloat(d.cum_moderate_benchmark_excess);
  } else if (benchmark == "Aggressive portfolio") {
    y = (d) => parseFloat(d.cum_aggressive_benchmark_excess);
  } else if (benchmark == "Conservative portfolio") {
    y = (d) => parseFloat(d.cum_conservative_benchmark_excess);
  }

  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);
  const I = d3.map(data, (_, i) => i);

  // Create scales

  const xDomain = d3.extent(X);
  const yDomain = d3.extent(Y);

  const xType = d3.scaleLinear;
  const xRange = [0, dimensions.boundedWidth];
  const yType = d3.scaleLinear;
  const yRange = [dimensions.boundedHeight, 0];

  //   const yFormat = d3.format(".1f");
  const yFormat = d3.format(`.0%`);

  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);

  // Draw canvas

  const strokeWidth = 3;

  const dataNest = Array.from(
    d3.group(data, (d) => d.plan_name),
    ([key, value]) => ({ key, value })
  );

  const line = d3
    .line()
    .curve(d3.curveCardinal)
    .x((d) => xScale(x(d)))
    .y((d) => yScale(y(d)));

  const t = d3.transition().duration(1000);

  const path_excessReturn = bound
    .select(".pathExcessReturn")
    .selectAll(".excessReturn")
    .data(dataNest)
    .join("path")
    .transition(t)
    .attr(
      "class",
      (d) => `excessReturn ${d.key} ${d.key === plan ? "focus-line" : ""}`
    )
    .attr("d", (d) => line(d.value))
    .attr("fill", "none")
    .attr("stroke", (d) => (d.key === plan ? "#f63" : "#ddd"))
    .attr("stroke-opacity", (d) => (d.key === plan ? 1 : 0.1))
    .attr("stroke-width", (d) => (d.key == plan ? strokeWidth : 1));

  const xTickValues = d3.range(d3.min(data, x), d3.max(data, x) + 1, 1);

  //   const yTickValues = d3.range(d3.min(data, y), d3.max(data, y), 0.2);
  //   const yTickValues = d3.range(-1, 1, 0.1);
  //   console.log(yTickValues);

  const xAxis = d3
    .axisBottom(xScale)
    // .tickValues(xTickValues)
    .tickFormat(d3.format(".0f"));

  bound
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

  const yAxis = d3
    .axisLeft(yScale)
    .ticks(6)
    .tickFormat(yFormat)
    .tickSizeOuter(0);

  bound
    .select(".y-axis")
    .call(yAxis)
    .style("color", "rgb(129, 129, 129)")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .attr("stroke-opacity", 0.5);

  bound
    .select(".y-axis")
    .selectAll(".tick text")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .style("fill", "rgb(129, 129, 129)")
    .style("font-family", "'Open Sans', sans-serif");

  const xmRange = [
    dimensions.margin.left,
    dimensions.width - dimensions.margin.right,
  ];
  const ymRange = [
    dimensions.height - dimensions.margin.bottom,
    dimensions.margin.top,
  ];

  const xmScale = xType(xDomain, xmRange);
  const ymScale = yType(yDomain, ymRange);

  const showTooltip = (e, datum) => {
    const [xm, ym] = d3.pointer(e);
    const j = d3.least(I, (i) =>
      Math.hypot(xmScale(X[i]) - xm, ymScale(Y[i]) - ym)
    );

    bound.selectAll(".excessReturn").each((d, i, nodes) => {
      if (Z[j] === d.key) {
        nodes[i].setAttribute("stroke", "#2879cb");
        nodes[i].setAttribute("stroke-opacity", 1);
        nodes[i].setAttribute("stroke-width", strokeWidth);
      } else if (d.key === plan) {
        nodes[i].setAttribute("stroke", "#f63");
        nodes[i].setAttribute("stroke-opacity", 1);
      } else {
        nodes[i].setAttribute("stroke", "#ddd");
        nodes[i].setAttribute("stroke-opacity", 0.1);
      }
    });
    dot
      .attr("transform", `translate(${xScale(X[j])}, ${yScale(Y[j])})`)
      .attr("display", null)

    dot
      .select(".plan-name")
      .text(Z[j])
      .attr("text-anchor", xScale(X[j]) > 3*dimensions.width/4 ? "end" : "middle")
      .style("font-size", "10px")
      .style("font-weight", 500)
      .style("fill", "black")
      .style("font-family", "'Open Sans', sans-serif");

    dot
      .select(".plan-excess-return")
      .text(`${yFormat(Y[j])}`)
      .style("font-size", "10px")
      .style("font-weight", 500)
      .style("fill", "black")
      .style("font-family", "'Open Sans', sans-serif");
  };

  const hideTooltip = (e, datum) => {
    bound.selectAll(".excessReturn").each((d, i, nodes) => {
      if (d.key === plan) {
        nodes[i].setAttribute("stroke", "#f63");
        nodes[i].setAttribute("stroke-opacity", 1);
      } else {
        nodes[i].setAttribute("stroke", "#ddd");
        nodes[i].setAttribute("stroke-opacity", 0.1);
      }
    });
    dot.attr("display", "none");
  };

  wrapper.on("mouseenter mousemove", showTooltip).on("mouseleave", hideTooltip);

  bound
    .select(".zeroLineExcessReturn")
    .transition(t)
    .attr("x1", xScale(xScale.domain()[0]))
    .attr("y1", yScale(0))
    .attr("x2", xScale(xScale.domain()[1]))
    .attr("y2", yScale(0))
    .style("stroke", "black")
    .style("stroke-opacity", 1)
    .style("stroke-width", strokeWidth);
}

export { drawExcessReturn_ };
