function parallaxEffect() {
    const parallax_el = document.querySelectorAll(".parallax");

    let xValue = 0, yValue = 0;

    window.addEventListener("mousemove", (e) => {
        xValue = e.clientX - window.innerWidth/2;
        yValue = e.clientY - window.innerHeight/2;

        parallax_el.forEach((el) => {
            let speedX = el.dataset.speedx;
            let speedY = el.dataset.speedy;
            el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) 
            translateY(calc(-50% + ${yValue * speedY}px))`;
        });
    });
}

function toggleMenu() {
    const menu = document.querySelector('.menu-links');
}

var i = 0;
function sloganTypingEffect() {
    console.log('function running');
    var txt = 'Welcome to my story.';
    var speed = 100;

    if (i < txt.length) {
        document.getElementById("sloganText").innerHTML += txt.charAt(i);
        i++;
        setTimeout(sloganTypingEffect, speed);
      }
}