//Function to set up the tabs interaction
function showVis(evt) {
    // Declare all variables
    let i, tablinks;

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";
}

/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };
const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

/*creating the actual SVG */
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Variables for the buttons so we can set up event listeners
const initialBtn = d3.select("#initialData");
const updateBtn = d3.select("#updatedData");

d3.csv("./data/US_Textile_Fiber_Trade.csv", parse).then(function (data) {

    /* filter subset of data, grabbing only the rows where the fiber type = raw cotton */
    const filtered_data_imports = data.filter(function (d) {
        return (d.fiber_type == "raw_cotton" && d.year == 2020 && d.import_export == "import");
    });
    const filtered_data_exports = data.filter(function (d) {
        return (d.fiber_type == "raw_cotton" && d.year == 2020 && d.import_export == "export");
    });

    //group the data by month
    const by_month_imports = d3.groups(filtered_data_imports, d => d.month)
    const by_month_exports = d3.groups(filtered_data_exports, d => d.month)

    //scales - xScale is a linear scale of the years
    const xScale = d3.scaleLinear()
        .domain([1,12])
        .range([margin.left, width - margin.right]);

    //calculate the total value for each month
    let value_by_month_imports = [] //an empty array to hold our new dataset
    for (let i = 0; i < by_month_imports.length; i++) {
        let month = by_month_imports[i][0]; //grab the numeric value of each month
        let nested = d3.nest() //create a nested data structure by month
            .key(d => d.month)
            .rollup(d => d3.sum(d, g => g.value)) //add up values of every month
            .entries(by_month_imports[i][1])
        nested.forEach((d) => d.key = +d.key) //d3.nest generates keys as strings, we need these as numbers to use our linear xScale 
        for (let j = 0; j < nested.length; j++) {
            value_by_month_imports.push({ //pushes the records created by the nesting function into our new array                
                month: month,
                value: nested[j].value
            })
        }
    }
    let value_by_month_exports = [] //an empty array to hold our new dataset
    for (let i = 0; i < by_month_exports.length; i++) {
        let month = by_month_exports[i][0]; //grab the numeric value of each month
        let nested = d3.nest() //create a nested data structure by month
            .key(d => d.month)
            .rollup(d => d3.sum(d, g => g.value)) //add up values of every month
            .entries(by_month_exports[i][1])
        nested.forEach((d) => d.key = +d.key) //d3.nest generates keys as strings, we need these as numbers to use our linear xScale 
        for (let j = 0; j < nested.length; j++) {
            value_by_month_exports.push({ //pushes the records created by the nesting function into our new array                
                month: month,
                value: nested[j].value
            })
        }
    }

    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));
        

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("2020 (mos.)");
        
    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Value (lbs.)")


    //this function handles the data-driven elements
    function draw(dataset) {

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => d.value)])
            .range([height - margin.bottom, margin.top]);

        let line = d3.line()
            .x(d => xScale(d.month))
            .y(d => yScale(d.value))

        //draw the path
        const path = svg.append("path")
            .datum(dataset)
            .attr("d", d => line(d));

        if (dataset == value_by_month_imports) {
            path.merge(path)
            .transition()
            .duration(1000)
            .attr("stroke", "#E6AA68")
            .attr("fill", "none")
            .attr("stroke-width", 5)
            .attr("class", "myLine");
        }
        if (dataset == value_by_month_exports) {
            path.merge(path)
            .transition()
            .duration(1000)
            .attr("stroke", "#E6AA68")
            .attr("fill", "none")
            .attr("stroke-width", 5)
            .attr("class", "myLine");
        }

        //axis updates
        yAxis.transition().duration(500).call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s")));
    }

    //initialize with the 2020 import dataset
    draw(value_by_month_imports);

    //buttons handles switching between datasets
    d3.select("#initialData")
        .on("click", function () {
            d3.selectAll(".myLine").transition().duration(500).style("opacity", 0)
            draw(value_by_month_imports)
    });
    d3.select("#updatedData")
        .on("click", function () {
            d3.selectAll(".myLine").transition().duration(500).style("opacity", 0)
            draw(value_by_month_exports)
    });

});

//get the data in the right format
function parse(d) {
    return {
        fiber_type: d.fiber_type, //cotton, silk, wool, etc.
        import_export: d.import_export, //this is a binary value
        category: d.category, //yarn, apparel, home, etc.
        sub_category: d.sub_category, //type of yarn, type of home
        year: +d.year, //we want this as a number
        month: +d.month, //we want this as a number
        value: +d.value //we want this as a number
    }
}

