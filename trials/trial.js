// $(document).ready(function () {
//   $("#select-element").selectpicker({

//   });

//   var data = [
//     { name: "Option 1" },
//     { name: "Option 2" },
//     { name: "Option 3" },
//     { name: "Option 4" },
//     { name: "Option 5" },
//   ];

//   d3.select("#select-element")
//     .selectAll("option")
//     .data(data)
//     .enter()
//     .append("option")
//     .attr("value", function (d) {
//       return d.name;
//     })
//     .text(function (d) {
//       return d.name;
//     });

//   $("#select-element").selectpicker("refresh");
// });

async function draw() {
  // 1. Access data
  const df_avgReturn_15Yr_253 = await d3.csv("../data/avgReturn_15Yr_253.csv");
  let allPlanNames = new Array();
  df_avgReturn_15Yr_253.forEach((d) => allPlanNames.push(d.plan_name));

  $(document).ready(function () {
    $("#select-element").selectpicker({
      noneSelectedText: "Select an option",
    });

    d3.select("#select-element")
      .selectAll("option")
      .data(allPlanNames)
      .enter()
      .append("option")
      .attr("value", function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });
    $("#select-element").selectpicker("refresh");
  });
}

draw();
