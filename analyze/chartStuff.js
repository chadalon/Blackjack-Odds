const ctx = document.getElementById('data-chart');

var curChart = null;

let myDiv = document.getElementById("data-follow");
//Detect touch device
function isTouchDevice() {
  try {
    //We try to create TouchEvent. It would fail for desktops and throw error
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
}
var x;
var y;
const move = (e) => {
  //Try, catch to avoid any errors for touch screens (Error thrown when user doesn't move his finger)
  try {
    //PageX and PageY return the position of client's cursor from top left of screen
    x = !isTouchDevice() ? e.pageX : e.touches[0].pageX;
    y = !isTouchDevice() ? e.pageY : e.touches[0].pageY;
  } catch (e) {}
  //set left and top of div based on mouse position
  myDiv.style.left = x - 50 + "px";
  myDiv.style.top = y - 90   + "px";
//   requestAnimationFrame(move);
};
// requestAnimationFrame(move);

//For mouse
document.addEventListener("mousemove", (e) => {
  move(e);
});
//For touch
document.addEventListener("touchmove", (e) => {
  move(e);
});

function createChart(dat)
{
    if (curChart)
        curChart.destroy();
    console.log(dat)

    curChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...Array(10).keys()],
        datasets: [{
          label: '# of Hits and win percentage',
          data: dat,
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    
}

export {createChart};