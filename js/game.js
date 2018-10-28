var margin = {top: 40, right: 40, bottom: 40, left: 40};

var svgGraph = d3.select("#graph"),
    width = svgGraph.node().getBoundingClientRect().width - margin.left - margin.right,
    height = svgGraph.node().getBoundingClientRect().height - margin.top - margin.bottom;

d3.csv("data/verbenListe.csv", function(error, data) {
    if (error) throw error;

    var hintergrund = svgGraph.append("g");

    hintergrund.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill", "#ece2f0");

    hintergrund.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width)
        .attr("height", height)
        .style("stroke","black")
        .style("stroke-width", "3")
        .style("fill", "#00f0");

    // 4 bucktabe mit 32vw ist genug gross
    // 3 bucktabe mit 50vw ist zu gross
    // 2 bucktabe mit 65vw ist zu gross

    praeposition = hintergrund.append("text")
        .attr("x", width/2)
        .attr("y", height - margin.bottom)
        .attr("text-anchor", "middle")
        .attr("font-size", "32vw")
        .style("fill", "#a6bddb")
        .style("opacity", 1);


    var tree = d3.nest()
        .key(function(d) { return d.Präposition; })
        .map(data);

    //praepositionenArr = tree.map(function(d){ return d.key})
    praepositionenArr = tree.keys()

    // Wahl ein präposition
    var gewaehltPraep = Math.random() * praepositionenArr.length | 0;
    praeposition.text(praepositionenArr[gewaehltPraep]);

    // Add circles
    var nummerWorteBild = 10;
    var prozentRichtig = 0.4;

    // die worte wählen
    var richtigeWorteListe = tree["$"+praepositionenArr[gewaehltPraep]].map(function(d){return d.Verb});
    var richtigeWorte = getRandomSubarray(richtigeWorteListe, Math.floor(nummerWorteBild*prozentRichtig));
    var worteListe = data.map(function(d){ return d.Verb});
    var falscheWorteList = diff(worteListe, richtigeWorteListe);
    var falscheWorte = getRandomSubarray(falscheWorteList, Math.ceil(nummerWorteBild*(1-prozentRichtig)));

    worteListe = richtigeWorte.map(function(d){ return {wort: d, type: "R"}});
    worteListe = worteListe.concat(falscheWorte.map(function(d){ return {wort: d, type: "F"}}));
    console.log(worteListe);

    worteListe = shuffle(worteListe);

    // die Punkt Zaehler
    var aktuelleGefunden = 0;
    var insgesamt = falscheWorte.length;
    var fehler = 0;

    var gZaehler = svgGraph.append("g");
    gZaehler.append("text")
        .attr("id", "Punktzahl")
        .attr("x", width)
        .attr("y", height)
        .attr("font-size", "8vw")
        .attr("text-anchor", "end")
        .style("fill", "#a6bddb")
        .text(aktuelleGefunden +"/" + insgesamt)

    var gFehlerZaehler = svgGraph.append("g");
    gFehlerZaehler.append("text")
        .attr("id", "Fehlerzahl")
        .attr("x", margin.left)
        .attr("y", height)
        .attr("font-size", "8vw")
        .style("fill", "#a6bddb")
        .attr("text-anchor", "start")
        .text(fehler);

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,1]);

    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,1]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var gWorte = svgGraph.append("g")
        .selectAll("g")
        .data(worteListe);

    gWorteEnter = gWorte.enter()
        .append("g")
        .attr("class",function(d,i){return "g "+i;})
/*
        .attr("transform", function(d,i){
            // Upper elipse
            var xPos = 0.5 - Math.cos(i/10*Math.PI)/2.5;
            var yPos = 0.5 - Math.sin(i/10*Math.PI)/2.5;
            return "translate(" + x(xPos) + "," + y(yPos) + ")"
        })
*/
        .on("click", function(d){
            if(d.type == "F"){
                d3.select(this).transition()
                    .duration(500)
                    .ease(d3.easeLinear)
                    .style("opacity", 0)
                    .remove();
                aktuelleGefunden += 1;
                d3.select("#Punktzahl")
                    .text(aktuelleGefunden+"/"+insgesamt);

                worteListe  = worteListe.filter(worte => worte.wort != d.wort)
                simulation.nodes(worteListe)
                simulation.restart();
            }if(d.type == "R"){
                fehler += 1;
                d3.select(this).transition()
                    .duration(80)
                    .attr("transform", "translate(8)")
                    .transition()
                    .duration(80)
                    .attr("transform", "translate(0)");
                d3.select("#Fehlerzahl")
                    .text(fehler);
                simulation.restart();
            }
        });

    gWorteEnter.append("circle")
        .attr("r",60)
        .attr("class",function(d,i){return "circle "+i;})
        .style("fill", "#1c9099")
        .style("opacity", 0.95);

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){return d.wort.replace(/sich|\(sich\)/g, "");})
        .style("font-family", "'Roboto', sans-serif")
        .style("font-weight", "bold")
        .attr("fill", "white");

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){
            if(d.wort.includes("(sich)")){return "(sich)";}
            if(d.wort.includes("sich")){return "sich";}
            return "";})
        .style("font-family", "'Roboto', sans-serif")
        .style("font-weight", "bold")
        .attr("dy", "-1em")
        .attr("fill", "white")

    var ticked = function() {
        /*aktualisieren die Simulation*/
        gWorteEnter.selectAll("circle")
            .attr("cx", function(d) { return d.x = Math.max(60+margin.left, Math.min(width - margin.right - 120, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(60+margin.top, Math.min(height - margin.bottom - 120, d.y)); });

        gWorteEnter.selectAll("text")
            .attr("x", function(d) { return d.x })
            .attr("y", function(d) { return d.y });
    };

    var simulation = d3.forceSimulation(worteListe)
        .force("x", d3.forceX(x(0.5)).strength(0.1))
        .force("y", d3.forceY(y(0.5)).strength(0.1))
        .force("collide", d3.forceCollide(60))
        .force("repulsion",d3.forceManyBody().strength(-2500))
        .on("tick",ticked);


});