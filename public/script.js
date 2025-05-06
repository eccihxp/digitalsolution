$("body").append("<div id='board'></div>")
for(let i=8;i>=1;i--){
    $("#board").append("<div></div>").children().last().addClass("row row"+i)
    for(let j=1;j<=8;j++){
        $(".row"+i).append("<div></div>").children().last().addClass("square " + String.fromCharCode(96+j) + i.toString() + " " + ((i+j)%2==0 ? "black" : "white"))
    }
}

$("#trigger").click(function(){
    fetch("/run-function", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ trigger: true })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message);
        $("#trigger").parent().append("<div>iosdfzuiohdfguih</div>")
    });
})

$("#testButton").click(function(){
    console.log("HELEAJAEAOoh");
})