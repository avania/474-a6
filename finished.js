// Resources (not included code available through course)
// https://medium.freecodecamp.org/learn-to-create-a-line-chart-using-d3-js-4f43f1ee716b

'use strict';

(function() {

  let data = "no data"; // Reference to selected year
  let dataEveryCountry = "no data"; // Reference to full data set
  let svgContainer = ""; // keep SVG reference in global scope
  let defaultCountry = 'AUS' // default country
  let tooltipSVG = "" // keep SVG reference for tooltip in global scope
  let div = "" // keep reference to div

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 900) // increase size to mimic Tableau chart
      .attr('height', 600); // increase size to mimic Tableau chart

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("dataEveryYear.csv")
      .then((csvData) => {
        dataEveryCountry = csvData;                  

        // Drop-down to filter by year
        var dropDown = d3.select('body')
          .append('select')
          .on('change', function() {
            makeScatterPlot(this.value);
          });

        // Array of years (use to populate options)
        let location = Array.from(new Set(dataEveryCountry.map((row) => row["location"])))
        
        // Options for the drop-down (default to 1977)
        var dropDownOptions = dropDown.selectAll('option')
          .data(location)
          .enter()
            .append('option')
            .text((d) => { return d; })
            .property("selected", function(d){ return d === defaultCountry; }); // Set default to AUS

    // make tooltip
    div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);

        // create tooltip svg
        tooltipSVG = d3.select("div")
        .append('svg')
        .attr('width', 300)
        .attr('height', 300)
        tooltipSVG.html("");

    makeToolTip()

        makeScatterPlot(defaultCountry);
      });
  }

  // make scatter plot with trend line
  function makeScatterPlot(country) {
    selectCountry(country);
    svgContainer.html("");
    
    // get arrays of fertility rate data and life Expectancy data
    let years_data = data.map((row) => parseFloat(row["time"])); // x-axis
    let population_data = data.map((row) => parseFloat(row["pop_mlns"])); //y-axis

    // find data limits
    let axesLimits = findMinMax(years_data, population_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels(country);
  }

  function selectCountry(country) {
    data = dataEveryCountry.filter((row) => row['location'] == country);
  }

  // make title and axes labels
  function makeLabels(country) {
    svgContainer.append('text')
      .attr('x', 250)
      .attr('y', 35)
      .style('font-size', '22pt')
      .text("World Populations Through Time");

      svgContainer.append('text')
      .attr('x', 450)
      .attr('y', 590)
      .style('font-size', '10pt')
      .text('Year');

      svgContainer.append('text')
      .attr('transform', 'translate(13, 315)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (millions)');

      svgContainer.append('text')
      .attr('x', 800)
      .attr('y', 530)
      .style('font-size', '14pt')
      .text(country);
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // scaling functions
    let xScale = map.xScale
    let yScale = map.yScale

        // Add line chart
        var line = d3.line()
        .x(function(d) { return xScale(d.time)})
        .y(function(d) { return yScale(d.pop_mlns)})

        svgContainer.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 5)
        .attr("d", line)
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

  }

  function makeToolTip(){
    // // Parse values
    let fertility_rate = dataEveryCountry.map((row) => parseFloat(row["fertility_rate"])); // x-axis
    let life_expectancy = dataEveryCountry.map((row) => parseFloat(row["life_expectancy"])); //y-axis
    // // Get min and max
    let axesLimits = findMinMax(fertility_rate, life_expectancy);
    // // Scale axes
    let mapFunctions = drawDivAxes(axesLimits, 'fertility_rate', 'life_expectancy');
    // // mapping functions
    let xMap = mapFunctions.x;
    let yMap = mapFunctions.y;

    // // scaling functions
    let xScale = mapFunctions.xScale
    let yScale = mapFunctions.yScale

    tooltipSVG.append('text')
    .attr('x', 40)
    .attr('y', 30)
    .style('font-size', '12pt')
    .text("Fertility Rate vs Life Expectancy");

    tooltipSVG.append('text')
    .attr('x', 125)
    .attr('y', 280)
    .style('font-size', '8pt')
    .text('Fertility Rate');

    tooltipSVG.append('text')
    .attr('transform', 'translate(20, 200)rotate(-90)')
    .style('font-size', '8pt')
    .text('Life Expectancy');

    tooltipSVG.selectAll('.dot')
      .data(dataEveryCountry)
      .enter()
      .append('circle')
        .attr('cx', x => xMap(x))
        .attr('cy', y => yMap(y))
        .attr('r', 3)
        .attr('fill', "#787777")
        .style("stroke", "black")
        .style("opacity", 0.3) // Make it possible to see all the dots
  }

  function drawDivAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin -1, limits.xMax+1]) // give domain buffer room
      .range([50, 250]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    tooltipSVG.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 250]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    tooltipSVG.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

    // draw the axes and ticks
    function drawAxes(limits, x, y) {
      // return x value from a row of data
      let xValue = function(d) { return +d[x]; }
  
      // function to scale x value
      let xScale = d3.scaleLinear()
        .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
        .range([50, 850]);
  
      // xMap returns a scaled x value from a row of data
      let xMap = function(d) { return xScale(xValue(d)); };
  
      // plot x-axis at bottom of SVG
      let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
      svgContainer.append("g")
        .attr('transform', 'translate(0, 550)')
        .call(xAxis);
  
      // return y value from a row of data
      let yValue = function(d) { return +d[y]}
  
      // function to scale y
      let yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
        .range([50, 550]);
  
      // yMap returns a scaled y value from a row of data
      let yMap = function (d) { return yScale(yValue(d)); };
  
      // plot y-axis at the left of SVG
      let yAxis = d3.axisLeft().scale(yScale).tickFormat(d3.format("d"));
      svgContainer.append('g')
        .attr('transform', 'translate(50, 0)')
        .call(yAxis);
  
      // return mapping and scaling functions
      return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
      };
    }
  

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
