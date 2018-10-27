var margin = {top: 40, right: 40, bottom: 40, left: 40};

var svgGraph = d3.select("#graph"),
    width = svgGraph.node().getBoundingClientRect().width - margin.left - margin.right,
    height = svgGraph.node().getBoundingClientRect().height - margin.top - margin.bottom;

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

function diff(A, B) {
    return A.filter(function (a) {
        return B.indexOf(a) == -1;
    });
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

d3.csv("data/verbenListe.csv", function(error, data) {
    if (error) throw error;

    var hintergrund = svgGraph.append("g");

    hintergrund.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "blue");

    // 4 bucktabe mit 32vw ist genug gross
    // 3 bucktabe mit 50vw ist zu gross
    // 2 bucktabe mit 65vw ist zu gross

    praeposition = hintergrund.append("text")
        .attr("x", width/2)
        .attr("y", height - margin.bottom)
        .attr("text-anchor", "middle")
        .attr("font-size", "32vw");


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
        .text(aktuelleGefunden +"/" + insgesamt)

    var gFehlerZaehler = svgGraph.append("g");
    gFehlerZaehler.append("text")
        .attr("id", "Fehlerzahl")
        .attr("x", margin.left)
        .attr("y", height)
        .attr("font-size", "8vw")
        .attr("text-anchor", "start")
        .text(fehler);

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,100]);

    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,100]);

    var gWorte = svgGraph.append("g")
        .attr("transform","translate("+margin.left+","+margin.top+")")
        .selectAll("g")
        .data(worteListe);

    gWorteEnter = gWorte.enter()
        .append("g")
        .attr("class",function(d,i){return "g "+i;})
        .attr("transform", function(d,i){return "translate(" + x(i*10) + "," + height/2 + ")"})
        .on("click", function(d){
            if(d.type == "F"){
                d3.select(this).transition()
                    .duration(1000)
                    .ease(d3.easeLinear)
                    .style("opacity", 0);
                aktuelleGefunden += 1;
                d3.select("#Punktzahl")
                    .text(aktuelleGefunden+"/"+insgesamt)
            }if(d.type == "R"){
                fehler += 1;
                d3.select("#Fehlerzahl")
                    .text(fehler)
            }
        });

    gWorteEnter.append("circle")
        .attr("r",60)
        .attr("class",function(d,i){return "circle "+i;});

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){return d.wort.replace(/sich|\(sich\)/g, "");})
        .attr("fill", "white");

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){
            if(d.wort.includes("(sich)")){return "(sich)";}
            if(d.wort.includes("sich")){return "sich";}
            return "";})
        .attr("dy", "-1em")
        .attr("fill", "white")


});