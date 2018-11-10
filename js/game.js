var margin = {top: 40, right: 40, bottom: 40, left: 40};

var svgGraph = d3.select("#graph"),
    width = svgGraph.node().getBoundingClientRect().width - margin.left - margin.right,
    height = svgGraph.node().getBoundingClientRect().height - margin.top - margin.bottom;

d3.tsv("data/verbenListe.txt", function(error, data) {
    if (error) throw error;

    var hintergrund = svgGraph.append("g");

    hintergrund.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "colBackground");

    // 4 bucktabe mit 32vw ist genug gross
    // 3 bucktabe mit 50vw ist zu gross
    // 2 bucktabe mit 65vw ist zu gross

    praeposition = hintergrund.append("text")
        .attr("x", width/2)
        .attr("y", 3*height/4)
        .attr("text-anchor", "middle")
        .attr("font-size", "32vw")
        .attr("class", "colText")
        .style("opacity", 1);

    var tree = d3.nest()
        .key(function(d) { return d.Präposition; })
        .map(data);

    //praepositionenArr = tree.map(function(d){ return d.key})
    praepositionenArr = tree.keys();

    // Wahl ein präposition
    var gewaehltPraep = Math.random() * praepositionenArr.length | 0;
    praeposition.text(praepositionenArr[gewaehltPraep]);

    // Add circles
    var nummerWorteBild = 6;
    var prozentRichtig = 0.4;

    // die worte wählen
    var richtigeWorteListe = tree["$"+praepositionenArr[gewaehltPraep]].map(function(d){return d});
    var richtigeWorte = getRandomSubarray(richtigeWorteListe, Math.floor(nummerWorteBild*prozentRichtig));
    var worteListe = data.map(function(d){ return d});
    var falscheWorteList = diffVerb(worteListe, richtigeWorteListe);
    var falscheWorte = getRandomSubarray(falscheWorteList, Math.ceil(nummerWorteBild*(1-prozentRichtig)));

    worteListe = richtigeWorte.map(function(d){ return {wort: d.Verb, type: "R", beispiel: d.Beispiel, kasus: d.Kasus}});
    worteListe = worteListe.concat(falscheWorte.map(function(d){ return {wort: d.Verb, type: "F", beispiel: d.Beispiel, kasus: d.Kasus}}));
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
        .attr("class", "colText")
        .text(aktuelleGefunden +"/" + insgesamt)

    var gFehlerZaehler = svgGraph.append("g");
    gFehlerZaehler.append("text")
        .attr("id", "Fehlerzahl")
        .attr("x", 0)
        .attr("y", height)
        .attr("dx","1em")
        .attr("font-size", "8vw")
        .attr("class", "colText")
        .attr("text-anchor", "end")
        .text(fehler);

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,1]);

    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,1]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var gWorte;
    var infoWindow;
    function showSynonyme(worte) {
        infoWindow = svgGraph.append("g");
        var background = infoWindow.append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .attr("class", "middle")
            .style("stroke","black")
            .style("stroke-width", "3")
            .style("stroke-opacity", "0.6");

        console.log(worte);

        var title = infoWindow.append("text")
            .attr("x", (width + margin.left + margin.right)/2)
            .attr("y", margin.top)
            .attr("dy", "1em")
            .attr("font-size", "5vw")
            .attr("text-anchor", "middle")
            .attr("class", "colText")
            .text("Synomyme von Openthesaurus.de");

        var close = infoWindow.append("text")
            .attr("x", width + margin.left)
            .attr("y", margin.top)
            .attr("dy", "0.8em")
            .attr("class", "fas")
            .attr("font-size", "10vw")
            .attr("text-anchor", "end")
            .attr("opacity", 0.4)
            .text("\uf00d")
            .on("click", function(){
                infoWindow.remove();
            });

        var gAntworte = infoWindow.append("g");
        var gWorte = infoWindow.selectAll("text.worte")
            .data(worte).enter()
            .append("text")
            .attr("class", "worte")
            .attr("font-size", "3vw")
            .style("font-family", "'Roboto', sans-serif")
            .attr("text-anchor", "start")
            .attr("dy", function(d,i){return "-"+2*i+"em"})
            .attr("x", margin.right+margin.left)
            .attr("y", height+margin.top-10)
            .text(function(d){return d})
            .on("click", function (d) {
                infoWindow.selectAll("text.worte")
                    .style("font-weight", "normal");
                d3.select(this)
                    .style("font-weight", "bold");
                gAntworte.remove();
                gAntworte = infoWindow.append("g");
                URL = "https://www.openthesaurus.de/synonyme/search?q="+d+"&format=application/json&substring=true";
                console.log(URL);
                fetch(URL)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        var terms = data.synsets[0].terms;
                        var antworte = terms.map(function(d){return d.term});
                        var size = 3;
                        if(antworte.length > worte.length*1.5){
                            size = 2;
                        }
                        gAntworte = infoWindow.selectAll("text.Antworte")
                            .data(antworte).enter()
                            .append("text")
                            .attr("class", "worte")
                            .attr("font-size", size+"vw")
                            .style("font-family", "'Roboto', sans-serif")
                            .attr("text-anchor", "start")
                            .attr("dy", function(d,i){return "-"+i+"em"})
                            .attr("x", (width+margin.right+margin.left)/2)
                            .attr("y", height+margin.top-10)
                            .text(function(d){return d});
                    })
                    .catch(err => {
                        console.error('An error ocurred', err);
                    });
            });
    }

    function buildGame(){
        gWorte = svgGraph.append("g")
            .selectAll("g")
            .data(worteListe);

        gWorteEnter = gWorte.enter()
            .append("g")
            .attr("class",function(d,i){return "g "+i;})
            .on("click", function(d){
                if(d.type == "F"){
                    playkurzSieg();
                    d3.select(this).transition()
                        .duration(500)
                        .ease(d3.easeLinear)
                        .style("opacity", 0)
                        .remove();
                    aktuelleGefunden += 1;
                    d3.select("#Punktzahl")
                        .text(aktuelleGefunden+"/"+insgesamt);

                    var siegZiehen = svgGraph.append("text")
                        .attr("fill", "#3c763d")
                        .attr("class","far")
                        .attr("font-size", "8vw")
                        .attr("dy", "-1em")
                        .attr("dx", "-1em")
                        .attr("x", width)
                        .attr("y", height)
                        .text("\uf118");

                    siegZiehen.transition()
                        .duration(1000)
                        .ease(d3.easeLinear)
                        .style("opacity", 0)
                        .attr("transform", "translate(0,"+(-height/2)+")")
                        .remove();

                    worteListe  = worteListe.filter(worte => worte.wort != d.wort);
                    simulation.nodes(worteListe);
                    simulation.force("repulsion").strength(simulation.force("repulsion").strength()-100);
                    simulation.restart();


                    if(aktuelleGefunden == insgesamt){
                        praeposition.remove();
                        gWorte.remove();
                        gWorteEnter.remove();

                        level1Beendet();
                    }

                }if(d.type == "R"){
                    playFehler();
                    fehler += 1;
                    d3.select(this).transition()
                        .duration(80)
                        .attr("transform", "translate(8)")
                        .transition()
                        .duration(80)
                        .attr("transform", "translate(0)");
                    d3.select("#Fehlerzahl")
                        .text(fehler);

                    // Trauriges Gesicht
                    var fehelerZiehen = svgGraph.append("text")
                        .attr("fill", "#a94442")
                        .attr("class","far")
                        .attr("font-size", "8vw")
                        .attr("dy", "-1em")
                        .attr("dx", "1em")
                        .attr("x", 0)
                        .attr("y", height)
                        .text("\uf119");

                    fehelerZiehen.transition()
                        .duration(2000)
                        .ease(d3.easeLinear)
                        .style("opacity", 0)
                        .attr("transform", "translate(0,"+(-height/2)+")")
                        .remove();

                    if(!d3.select("#zBLevel1").empty()){
                        d3.select("#zBLevel1").remove()
                    }

                    // Zeihgen Beispiel
                    var beispiel = svgGraph.append("text")
                        .attr("fill", "#a94442")
                        .attr("id", "zBLevel1")
                        .attr("font-size", "3vw")
                        .attr("x", (width+margin.right+margin.left)/2)
                        .attr("text-anchor", "middle")
                        .attr("y", height)
                        .text("z.B."+ d.beispiel);

                    beispiel.transition()
                        .duration(8000)
                        .ease(d3.easeLinear)
                        .style("opacity", 0)
                        .remove();

                    simulation.restart();
                }
            });

        gWorteEnter.append("circle")
            .attr("r",60)
            .attr("class",function(d,i){return "circle "+i+ " colFigures";})
            .style("opacity", 0.7);

        gWorteEnter.append("text")
            .attr("text-anchor", "middle")
            .text(function(d){return d.wort.replace(/sich|\(sich\)/g, "");})
            .style("font-family", "'Roboto', sans-serif")
            .attr("font-size", "1.5vw")
            .style("font-weight", "bold")
            .attr("fill", "black");

        gWorteEnter.append("text")
            .attr("text-anchor", "middle")
            .text(function(d){
                if(d.wort.includes("(sich)")){return "(sich)";}
                if(d.wort.includes("sich")){return "sich";}
                return "";})
            .style("font-family", "'Roboto', sans-serif")
            .attr("font-size", "1.5vw")
            .style("font-weight", "bold")
            .attr("dy", "-1em")
            .attr("fill", "black")

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
            .force("x", d3.forceX(x(0.5)).strength(0.05))
            .force("y", d3.forceY(y(0.5)).strength(0.05))
            .force("collide", d3.forceCollide(60))
            .force("repulsion",d3.forceManyBody().strength(-1300))
            .on("tick",ticked);

        var siegFrage = svgGraph.append("text")
            .attr("class","fas")
            .attr("font-size", "8vw")
            .attr("x", width + margin.left)
            .style("opacity", 0.8)
            .attr("text-anchor", "end")
            .attr("dy", "1em")
            .text("\uf02d")
            .on("click", function(){
                showSynonyme(worteListe.map(function(d){return d.wort}));
            });
    };

    buildGame();

    var level1Beendet = function(){
        playlangSieg();
        var gEndLevel = svgGraph.append("g");
        var titel = gEndLevel.append("text")
            .attr("id", "wahlTexte")
            .attr("x", width/2)
            .attr("y", height/4)
            .attr("font-size", "6vw")
            .attr("text-anchor", "middle")
            .attr("class", "colText")
            .text("Level beendet!");

        var nochmal = gEndLevel.append("text")
            .attr("fill", "black")
            .attr("class","fas")
            .attr("font-size", "8vw")
            .attr("x", width/6)
            .attr("y", 2*height/3)
            .text("\uf01e")
            .on("click", function(){
                gEndLevel.remove();
                gewaehltPraep = Math.random() * praepositionenArr.length | 0;

                praeposition = hintergrund.append("text")
                    .attr("x", width/2)
                    .attr("y", 3*height/4)
                    .attr("class", "colText")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "32vw")
                    .style("opacity", 1)
                    .text(praepositionenArr[gewaehltPraep]);

                richtigeWorteListe = tree["$"+praepositionenArr[gewaehltPraep]].map(function(d){return d});
                richtigeWorte = getRandomSubarray(richtigeWorteListe, Math.floor(nummerWorteBild*prozentRichtig));
                worteListe = data.map(function(d){ return d});
                falscheWorteList = diffVerb(worteListe, richtigeWorteListe);
                falscheWorte = getRandomSubarray(falscheWorteList, Math.ceil(nummerWorteBild*(1-prozentRichtig)));

                worteListe = richtigeWorte.map(function(d){ return {wort: d.Verb, type: "R", beispiel: d.Beispiel, kasus: d.Kasus}});
                worteListe = worteListe.concat(falscheWorte.map(function(d){ return {wort: d.Verb, type: "F", beispiel: d.Beispiel, kasus: d.Kasus}}));
                worteListe = shuffle(worteListe);

                aktuelleGefunden = 0;
                insgesamt = falscheWorte.length;

                gZaehler.select("#Punktzahl")
                    .text(aktuelleGefunden +"/" + insgesamt);
                gFehlerZaehler.select("#Fehlerzahl")
                    .text(fehler);

                buildGame();
        });

        var naechste = gEndLevel.append("text")
            .attr("fill", "black")
            .attr("class","fas")
            .attr("font-size", "8vw")
            .attr("x", 5*width/6)
            .attr("y", 2*height/3)
            .text("\uf061")
            .on("click", function(){
                gEndLevel.remove();
                gZaehler.remove();
                gFehlerZaehler.remove();
                buildLevel2();
            });

        var beispiel = gEndLevel.append("text")
            .attr("id", "zBLevel1")
            .attr("font-size", "3vw")
            .style("font-family", "'Roboto', sans-serif")
            .attr("x", (width+margin.right+margin.left)/2)
            .attr("text-anchor", "middle")
            .attr("class", "colText")
            .style("opacity", 0.5)
            .attr("y", height)
            .text("Klick auf ein Verb, um eine Beispiel zu zeigen");

        var gWorte = gEndLevel.selectAll("text.worte")
            .data(richtigeWorte).enter()
            .append("text")
            .attr("class", "worte far")
            .attr("font-size", "3vw")
            .style("font-family", "'Roboto', sans-serif")
            .attr("text-anchor", "middle")
            .attr("dy", function(d,i){return "-"+2*i+"em"})
            .attr("x", (width+margin.right)/2)
            .attr("y", height/2)
            .text(function(d){return d.Verb +" "+ praepositionenArr[gewaehltPraep]+" + "+d.Kasus})
            .on("click", function (d) {
                beispiel.text("z.B."+ d.Beispiel)
                    .style("opacity", 1);
            });
    };

    function buildLevel2(){
        var gHintergrund = svgGraph.append("g");
        var gWort = svgGraph.append("g");
        var istLinksRichtig;
        var currentWort;
        var enter;
        var zahlFehler = 0;
        var endLevel = false;

        gHintergrund.append("rect")
            .attr("class", "leftSide")
            .attr("width",width/2 + margin.left)
            .attr("height",height + margin.top + margin.bottom);

        svgGraph.append("rect")
            .attr("width",width/2 + margin.left)
            .attr("height",height + margin.top + margin.bottom)
            .style("opacity", 0)
            .on("click", function(){
                enter.interrupt().select("*").interrupt();
                if(endLevel == true){return;}
                if(istLinksRichtig){
                    showHappySmiley(true, this);
                    showAnswer(false)}
                else{
                    showSadSmiley(true, this);
                    zahlFehler += 1;
                    showAnswer(true);
                }
            });

        gHintergrund.append("rect")
            .attr("class", "rightSide")
            .attr("x", width/2 + margin.left)
            .attr("width",width/2 + margin.right)
            .attr("height",height + margin.top + margin.bottom);


        svgGraph.append("rect")
            .attr("x", width/2 + margin.left)
            .attr("width",width/2 + margin.right)
            .attr("height",height + margin.top + margin.bottom)
            .style("opacity", 0)
            .on("click", function(){
                enter.interrupt().select("*").interrupt();
                if(endLevel == true){return;}
                if(!istLinksRichtig){
                    showHappySmiley(false, this);
                    showAnswer(true)}
                else{showSadSmiley(false, this);
                    zahlFehler += 1;
                    showAnswer(false);
                }
            });

        var treeVerben = d3.nest()
            .key(function(d) { return d.Verb; })
            .map(data);

        var treePraepositionen = d3.nest()
            .key(function(d) { return d.Präposition+" + "+d.Kasus; })
            .map(data);

        var zahlWorte = 5;
        var verbenArr = treeVerben.keys();
        var worteList = getRandomSubarray(verbenArr, verbenArr.length);
        console.log(tree);

        var praepositionenUndKasusArr = treePraepositionen.keys();

        // Wahl ein wort
        function neueWort(wort){

            var siegFrage = svgGraph.append("text")
                .attr("class","fas")
                .attr("font-size", "8vw")
                .attr("x", width + margin.left)
                .style("opacity", 0.8)
                .attr("text-anchor", "end")
                .attr("dy", "1em")
                .text("\uf02d")
                .on("click", function(){
                showSynonyme([wort]);
            });

            endLevel = false;
            var linkerText = gHintergrund.append("text")
                .attr("x", 0)
                .attr("y", 3*height/4)
                .attr("text-anchor", "start")
                .attr("font-size", "10vw")
                .style("fill", "black")
                .style("opacity", 0.7);

            var rechterText = gHintergrund.append("text")
                .attr("x", width + margin.left + margin.right)
                .attr("y", 3*height/4)
                .attr("class", "middle")
                .attr("text-anchor", "end")
                .attr("font-size", "10vw")
                .style("fill", "black")
                .style("opacity", 0.7);

            svgGraph.append("text")
                .attr("id", "Fehlerzahl")
                .attr("x", margin.left)
                .attr("y", height + margin.bottom)
                .attr("dx","0em")
                .attr("font-size", "8vw")
                .attr("class", "middle")
                .attr("text-anchor", "start")
                .text(zahlFehler);

            var verb = treeVerben["$"+wort];
            // wahl die richtige praeposition
            var praepositionen = verb.map(function(d){return d.Präposition+" + "+d.Kasus});
            var richtigePraep = Math.random() * praepositionen.length | 0;

            currentWort = verb[richtigePraep];

            // wahl die falsches praeposition
            var restPraep = diff(praepositionenUndKasusArr, praepositionen);
            var falschesPraep = Math.random() * restPraep.length | 0;

            // die seite for richtige option wahlen, links < 0.5
            if(Math.random() <=  0.5){
                istLinksRichtig = true;
                linkerText.text(praepositionen[richtigePraep]);
                rechterText.text(restPraep[falschesPraep]);
            }else{
                istLinksRichtig = false;
                linkerText.text(restPraep[falschesPraep]);
                rechterText.text(praepositionen[richtigePraep]);
            }

            // der fallende Kreis bauen
            enter = gWort.selectAll("g")
                .data([praepositionen[richtigePraep]])
                .enter()
                .append("g");

            enter.append("text")
                .attr("id", "hourglass")
                .attr("x", width/2 + margin.left)
                .attr("y", margin.top)
                .attr("class","fas colFigures middle")
                .attr("text-anchor", "middle")
                .attr("font-size", "12vw")
                .text("\uf251");

            enter.append("text")
                .attr("text-anchor", "middle")
                .style("font-family", "'Roboto', sans-serif")
                .attr("font-size", "4vw")
                .style("font-weight", "bold")
                .attr("fill", "black")
                .attr("x", width/2 + margin.left)
                .text(function(d){return wort.replace(/sich|\(sich\)/g, "");});

            enter.append("text")
                .attr("text-anchor", "middle")
                .style("font-family", "'Roboto', sans-serif")
                .attr("font-size", "4vw")
                .style("font-weight", "bold")
                .attr("dy", "-1em")
                .attr("fill", "black")
                .attr("x", width/2 + margin.left)
                .text(function(d){
                    if(wort.includes("(sich)")){return "(sich)";}
                    if(wort.includes("sich")){return "sich";}
                    return "";});

            time = 7000;
            playHintergrundMusik();
            enter.transition()
                .duration(time)
                .ease(d3.easeLinear)
                .attr("transform", "translate(0,"+(height + margin.top + margin.bottom)+")")
                .on("end", function(){
                    if(endLevel == false){
                        zahlFehler += 1;
                        d3.selectAll("#Fehlerzahl").text(zahlFehler);
                        showAnswer(!istLinksRichtig);
                    }
                });

            enter.selectAll("#hourglass").transition()
                .delay(time/3)
                .text(function(){return "\uf252"})
                .transition()
                .delay(time/3)
                .text(function(){return "\uf253"})
        }

        function showHappySmiley(showLeft, node){
            playlangSieg();
            stopHintergrundMusik();
            var siegZiehen = svgGraph.append("text")
                .attr("fill", "#3c763d")
                .attr("class","far")
                .attr("font-size", "8vw")
                .attr("text-anchor", "middle")
                .attr("x", d3.mouse(node)[0])
                .attr("y", d3.mouse(node)[1])
                .text("\uf118");
            siegZiehen.transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .style("opacity", 0)
                .attr("font-size", "16vw")
                .remove();
        }
        function showSadSmiley(showLeft, node){
            playFehler();
            stopHintergrundMusik();
            var siegZiehen = svgGraph.append("text")
                .attr("fill", "#a94442")
                .attr("class","far")
                .attr("font-size", "8vw")
                .attr("text-anchor", "middle")
                .attr("x", d3.mouse(node)[0])
                .attr("y", d3.mouse(node)[1])
                .text("\uf119");
            siegZiehen.transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .style("opacity", 0)
                .attr("font-size", "16vw")
                .remove();
        }


        function showAnswer(showFehlerOnLeft){
            endLevel = true;
            var posFehler = width/4 + margin.left;
            if(!showFehlerOnLeft) posFehler = 3*width/4 + margin.left;

            var posRichtig = 3*width/4 + margin.left;
            if(!showFehlerOnLeft) posRichtig = width/4 + margin.left;

            var fehlerZiehen = svgGraph.append("text")
                .attr("fill", "#a94442")
                .attr("class","far")
                .attr("font-size", "16vw")
                .attr("text-anchor", "middle")
                .attr("x", posFehler)
                .attr("y", height/3 + margin.top)
                .text("\uf057");

            var richtigZiehen = svgGraph.append("text")
                .attr("fill", "#3c763d")
                .attr("class","far")
                .attr("font-size", "16vw")
                .attr("text-anchor", "middle")
                .attr("x", posRichtig)
                .attr("y", height/3 + margin.top)
                .text("\uf058");

            var beispiel = svgGraph.append("text")
                .attr("class","far")
                .attr("font-size", "3vw")
                .style("font-family", "'Roboto', sans-serif")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("x", width/2 + margin.left)
                .attr("y", 3*height/4 + margin.top)
                .text("z.B. "+currentWort.Beispiel);

            var nochmal = svgGraph.append("text")
                .attr("fill", "black")
                .attr("class","fas")
                .attr("font-size", "8vw")
                .attr("text-anchor", "middle")
                .attr("opacity", 0.7)
                .attr("x", width/2+margin.left)
                .attr("y", 1*height/3)
                .text("\uf01e")
                .on("click", function(){
                    d3.selectAll("text").remove();
                    gWort.selectAll("g").remove();
                    currentIndex += 1;
                    neueWort(worteList[currentIndex])
                });
            d3.selectAll("#Fehlerzahl").text(zahlFehler);
        }
        var currentIndex = 0;
        neueWort(worteList[0])

    }

});