
function drawAvgReturn_(
    data,
    dimensions,
    plan,
    benchmark,
    period
){
    const minValue = d3.min([
        d3.min(data, d => parseFloat(d.avg_opt_benchmark_return)),
        d3.min(data, d => parseFloat(d.avg_custom_benchmark_return))
    ])

    const maxValue = d3.max([
        d3.max(data, d => parseFloat(d.avg_opt_benchmark_return)),
        d3.max(data, d => parseFloat(d.avg_custom_benchmark_return))
    ])

    const subDataset = data.filter(d => d.plan_name === plan)

    const avgOptBenchmarkReturn = subDataset[0].avg_opt_benchmark_return
    const avgCustomBenchmarkReturn = subDataset[0].avg_custom_benchmark_return
    const actualAvgReturn = subDataset[0].avg_return

    const numberFormat = d3.format(".2%")

    d3.select("#period").text(period)
    d3.select("#plan").text(plan)
    d3.select("#planReturn").text(numberFormat(actualAvgReturn))
    d3.select("#benchmarkReturn").text(numberFormat(benchmark === 'Optimal benchmark' ? 
                                    avgOptBenchmarkReturn : avgCustomBenchmarkReturn))


}

export {drawAvgReturn_}


    // Create nodes for each data points
    // let nodes = [
    //     benchmark === 'Optimal benchmark' ? avgOptBenchmarkReturn : avgCustomBenchmarkReturn,
    //     actualAvgReturn
    // ]

    // const yScale = d3.scaleLinear()
    //     .domain([minValue, maxValue])
    //     .range([dimensions.boundedHeight, 0])
    //     .nice()

    // const circle_avgReturn = d3.select(".circleAvgReturn")
    //         .selectAll("circle")
    //         .data(nodes)
    //         .join("circle")
    //         .transition().duration(500)
    //         .attr("cx", dimensions.width / 4 )
    //         .attr("cy", d => yScale(d))
    //         .attr("r", 8)
    //         .attr('fill', (d, i) => i === 0 ? "blue" : "red")
    //         .attr("fill-opacity", 0.5)

    // const yAxisGenerator = d3.axisLeft(yScale).ticks(7).tickSize(5)
    // const yAxis = bound.select(".y-axis")
    //                     .call(yAxisGenerator)