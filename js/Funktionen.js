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

function diffVerb(A, B) {
    B = B.map(function(d){return d.Verb});
    return A.filter(function (a) {
        return B.indexOf(a.Verb) == -1;
    });
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

var fxFehler = document.getElementById("FXfehler");
var kurzSieg = document.getElementById("FXKurzSieg");
var langSieg = document.getElementById("FXLangSieg");
var hintergrundMusik = document.getElementById("FXHinterGrundMusik");
function playFehler() {fxFehler.play();}
function playkurzSieg() {kurzSieg.play();}
function playlangSieg() {langSieg.play();}
function playHintergrundMusik() {hintergrundMusik.play();}
function stopHintergrundMusik() {hintergrundMusik.pause();hintergrundMusik.load();}