
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
    const yearAccessor = d => parseInt(d.fy)
    const xtickValues = (d3.range(d3.min(data, yearAccessor),
                        d3.max(data, yearAccessor) + 1, 1))

    let benchmarkReturnAccessor
    if(benchmark === 'Optimal benchmark'){
        benchmarkReturnAccessor =  d => parseFloat(d.cum_opt_benchmark_excess)
    } else {
        benchmarkReturnAccessor = d => parseFloat(d.cum_custom_benchmark_excess)
    }

    const yearValue = d3.map(data, yearAccessor)
    const benchmarkReturn = d3.map(data, benchmarkReturnAccessor)
    const Z = d3.map(data, d => d.plan_name)

    const zDomain = new d3.InternSet(Z)
    const I = d3.range(yearValue.length).filter(i => zDomain.has(Z[i]));

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, yearAccessor))
        .range([0, dimensions.boundedWidth])

            
    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, benchmarkReturnAccessor))
        .range([dimensions.boundedHeight, 0])

        
    // Draw canvas
    const dataNest = Array.from(
        d3.group(data, d => d.plan_name), ([key, value]) => ({key, value})
    );
    
    const line = d3.line()
        .x(d => xScale(yearAccessor(d)))
        .y(d => yScale(benchmarkReturnAccessor(d)))

    const path_excessReturn = bound.select(".pathExcessReturn").selectAll("path")
        .data(dataNest)
        .join("path")
        .attr("d", d => line(d.value))
        .attr("fill", "none")
        .style("stroke", d => d.key === plan ? "maroon" : "steelblue")
        .style("stroke-opacity", d => d.key === plan ? 1 : 0.05)
        .style("mix-blend-mode", "multiply")


    // Draw peripherals
    const yAxisGenerator = d3.axisLeft(yScale).ticks(6)
    const yAxis = bound.select(".y-axis").call(yAxisGenerator)

    const xAxisGenerator = d3.axisBottom(xScale)
                    .tickValues(xtickValues)
                    .tickFormat(d3.format(".0f"))
    const xAxis = bound.select(".x-axis")
                    .call(xAxisGenerator)
                    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
                    

    bound.select(".zeroLineExcessReturn").raise()
            .transition().duration(100)
            .attr("x1", xScale(xScale.domain()[0]))
            .attr("y1", yScale(0))
            .attr("x2", xScale(xScale.domain()[1]))
            .attr("y2", yScale(0))
            .style("stroke", "black")
            .style("stroke-opacity", 1)

    bound.select(".title")
        .attr("x", dimensions.width / 2)
        .attr("y", -dimensions.margin.top / 2)
        .style("font-size", "16px")
        .attr("font-weight", 700)
        .attr("text-anchor", "middle")
        .text("Excess return")

    // Set up interaction
    const xmScale = d3.scaleLinear()
        .domain(d3.extent(data, yearAccessor))
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])

    const ymScale = d3.scaleLinear()
        .domain(d3.extent(data, benchmarkReturnAccessor))
        .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])

    wrapper
        .on("pointerenter", pointerEnter)
        .on("pointermove", pointerMove)
        .on("pointerleave", pointerLeave)

    function pointerMove(e){
        const [xm, ym] = d3.pointer(e)
        const i = d3.least(I, i => Math.hypot(xmScale(yearValue[i]) - xm, ymScale(benchmarkReturn[i]) - ym)); // closest point
        path_excessReturn
            .style("stroke", d => {
                if (d.key === plan){return "red"}
                else if (d.key === Z[i]){return "steelblue"}
                else {return "#ddd"}
            })
            .style("stroke-opacity", d => d.key === Z[i] || d.key === plan ? 1 : 0.05)
        dot.attr("transform", `translate(${xScale(yearValue[i])},${yScale(benchmarkReturn[i])})`);
        if (Z) dot.select("text").text(Z[i]);
    }

    function pointerEnter(e){
        dot.attr("display", null);
    }

    function pointerLeave(e){
        path_excessReturn
            .transition().duration(1000)
            .style("mix-blend-mode", "multiply")
            .style("stroke", d => d.key === plan ? "maroon" : "steelblue")
            .style("stroke-opacity", d => d.key === plan ? 1 : 0.05)
        dot.attr("display", "none");
    }
}

export {drawExcessReturn_}