
function drawExcessReturn_(
    data,
    dimensions,
    plan,
    benchmark,
    bound,
    wrapper,
    dot
){
    // Access data

    const x = d => parseInt(d.fy)
    const z = d => d.plan_name

    let y
    if(benchmark === 'Optimal benchmark'){
        y =  d => parseFloat(d.cum_opt_benchmark_excess)
    } else {
        y = d => parseFloat(d.cum_custom_benchmark_excess)
    }

    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z)
    const I = d3.map(data, (_, i) => i);

    // Create scales

    const xDomain = d3.extent(X)
    const yDomain = d3.extent(Y)

    const xType = d3.scaleLinear
    const xRange = [0, dimensions.boundedWidth]
    const yType = d3.scaleLinear
    const yRange = [dimensions.boundedHeight, 0]


    const yFormat = d3.format(".1f")
    const xScale = xType(xDomain, xRange)
    const yScale = yType(yDomain, yRange)

    // Draw canvas

    const dataNest = Array.from(
        d3.group(data, d => d.plan_name), ([key, value]) => ({key, value})
    );

    const line = d3.line()
        .curve(d3.curveLinear)
        .x(d => xScale(x(d)))
        .y(d => yScale(y(d)))

    const t = d3.transition()
        .duration(1000)

    const path_excessReturn = bound.select(".pathExcessReturn")
        .selectAll(".excessReturn")
        .data(dataNest)
        .join("path").transition(t)
            .attr("class", d => `excessReturn ${d.key}`)
            .attr("d", d => line(d.value))
            .attr("fill", "none")
            .attr("stroke", d => d.key === plan ? "maroon" : "steelblue")
            .attr("stroke-opacity", d => d.key === plan ? 1 : 0.05)

    const xTickValues = d3.range(d3.min(data, x),
                        d3.max(data, x) + 1, 1)

    const yTickValues = d3.range(d3.min(data, y),
                        d3.max(data, y), 0.1)

    const xAxis = d3.axisBottom(xScale)
                .tickValues(xTickValues)
                .tickFormat(d3.format(".0f"))
                        
    bound.select(".axis-x").call(xAxis)
    
    const yAxis = d3.axisLeft(yScale)
                .tickFormat(yFormat)
                .tickSizeOuter(0)

    bound.select(".axis-y").call(yAxis)

    const xmRange = [dimensions.margin.left, dimensions.width - dimensions.margin.right]
    const ymRange = [dimensions.height - dimensions.margin.bottom, dimensions.margin.top]

    const xmScale = xType(xDomain, xmRange)
    const ymScale = yType(yDomain, ymRange)

    const showTooltip = (e,datum) => {
        const [xm, ym] = d3.pointer(e)
        const j = d3.least(I, i => Math.hypot(xmScale(X[i]) - xm, ymScale(Y[i]) - ym))

        bound
            .selectAll(".excessReturn")
            .each((d,i, nodes) => {
                if(Z[j] === d.key){
                    nodes[i].setAttribute("stroke", "steelblue")
                    nodes[i].setAttribute("stroke-opacity", 1)
                } else if (d.key === plan){
                    nodes[i].setAttribute("stroke", "maroon")
                    nodes[i].setAttribute("stroke-opacity", 1)
                } else {
                    nodes[i].setAttribute("stroke", "#ddd")
                    nodes[i].setAttribute("stroke-opacity", 0.05)
                }
            })
        dot
            .attr("transform", `translate(${xScale(X[j])}, 
                                            ${yScale(Y[j])})`)
            .attr("display", null)

        dot.select("text").text(Z[j])
        
    }

    const hideTooltip = (e,datum) => {
        bound
            .selectAll(".excessReturn")
            .each((d, i, nodes) => {
                if(d.key === plan){
                    nodes[i].setAttribute("stroke", "maroon")
                    nodes[i].setAttribute("stroke-opacity", 1)
                } else {
                    nodes[i].setAttribute("stroke", "steelblue")
                    nodes[i].setAttribute("stroke-opacity", 0.05)
                }
            })
        dot.attr("display", "none")
    }

    wrapper
        .on("mouseenter mousemove", showTooltip)
        .on("mouseleave", hideTooltip)

    bound.select(".zeroLineExcessReturn")
        .transition(t)
        .attr("x1", xScale(xScale.domain()[0]))
        .attr("y1", yScale(0))
        .attr("x2", xScale(xScale.domain()[1]))
        .attr("y2", yScale(0))
        .style("stroke", "black")
        .style("stroke-opacity", 0.7)

    bound.select(".title")
        .attr("x", dimensions.width / 2)
        .attr("y", -dimensions.margin.top / 2)
        .style("font-size", "16px")
        .attr("font-weight", 700)
        .attr("text-anchor", "middle")
        .text("Excess return")

}

export {drawExcessReturn_}