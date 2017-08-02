// Javascript Content

// Initial Values

var squareSize = 5;
var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

// ++++++++++++++
// Global Values

var MouseX, MouseY;

// ++++++++++++++



// var animator = setInterval(MainLoop, 33); // ~30fps
var animator = setInterval(MainLoop, 25); // 40fps
// var animator = setInterval(MainLoop, 20); // 50fps

document.addEventListener("mousemove", mousePos);
function mousePos() {
    MouseX = event.clientX;
    MouseY = event.clientY;
}

document.addEventListener("keydown", keyPressed);
function keyPressed() {
    console.log(event.keyCode);
    switch (event.keyCode) {
        case 32: // Space Key Pressed

            break;
        case 37: // Left Key Pressed

            break;
        case 38: // Up Key Pressed

            break;
        case 39: // Right Key Pressed

            break;
        case 40: // Down Key Pressed

            break;        
    }
}

class pixel {
    constructor (LocationX, LocationY, Rotation, OffsetX, OffsetY, R, G, B) {
        this.locationX = LocationX;
        this.locationY = LocationY;
        this.rotation = Rotation;
        this.offsetX = OffsetX;
        this.offsetY = OffsetY;
        this.r = R;
        this.g = G;
        this.b = B;
    }
    get LocationX() {return this.locationX;}
    set LocationX(value) {this.locationX = value;}
    get LocationY() {return this.locationY;}
    set LocationY(value) {this.locationY = value;}
    get Rotation() {return this.rotation;}
    set Rotation(value) {this.rotation = value;}
    get OffsetX() {return this.offsetX;}
    set OffsetX(value) {this.offsetX = value;}
    get OffsetY() {return this.offsetY;}
    set OffsetY(value) {this.offsetY = value;}
    get R() {return this.r;}
    set R(v) {this.r = v;}
    get G() {return this.g;}
    set G(v) {this.g = v;}
    get B() {return this.b;}
    set B(v) {this.b = v;}

    draw() {
        var drawX, drawY;
        drawX = (this.OffsetX * squareSize);
        drawY = (this.OffsetY * squareSize);
        var realX, realY;
        realX = drawX*Math.cos(this.rotation) - drawY*Math.sin(this.rotation) + this.locationX;
        realY = drawX*Math.sin(this.rotation) + drawY*Math.cos(this.rotation) + this.locationY;
        ctx.translate(realX, realY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = String("rgb(" + this.r + "," + this.g + "," + this.b + ")");
        ctx.fillRect(- (squareSize / 2), - (squareSize / 2), squareSize, squareSize);
        ctx.setTransform(1,0,0,1,0,0);
        // console.log(this.rotation);
    }


    isDead() {
        if (this.r <= 0 && this.g <= 0 && this.b <= 0) {return true;}
        else {return false;}
    }
}

class derbis {
    constructor (LocationX, LocationY, VelocityX, VelocityY, Rotation,  R, G, B) {

    }
}

class entity {
    constructor (LocationX, LocationY, VelocityX, VelocityY, AccelerationX, AccelerationY, 
                Rotation, RotVelocity, RotAcceleration, DamageOutput, Thrust, TurnSpeed) {
        this.locationX = LocationX;
        this.locationY = LocationY;
        this.velocityX = VelocityX;
        this.velocityY = VelocityY;
        this.accelX = AccelerationX;
        this.accelY = AccelerationY;
        this.rotation = Rotation;
        this.rotVelocity = RotVelocity;
        this.rotAccel = RotAcceleration;
        this.damOut = DamageOutput;
        this.thrust = Thrust;
        this.turnSpeed = TurnSpeed;
        this.pixArray = new Array(0);
    }

    get Rotation() {return this.rotation;}
    set Rotation(value) {this.rotation = value;}
    get LocationX() {return this.locationX;}
    set LocationX(value) {this.locationX = value;}
    get LocationY() {return this.locationY;}
    set LocationY(value) {this.locationY = value;}

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var p = 0; p < this.pixArray.length; p++) {
            this.pixArray[p].LocationX = this.locationX;
            this.pixArray[p].LocationY = this.locationY;
            this.pixArray[p].Rotation = this.rotation;
            this.pixArray[p].draw();
        }
    }

    reassessStats() {
        var sumR = 0; var sumG = 0; var sumB = 0;
        for (var p = 0; p < this.pixArray.length; p++) {
            sumR += this.pixArray[p].R;
            sumG += this.pixArray[p].G;
            sumB += this.pixArray[p].B;
        }
        this.damOut = sumR;
        this.thrust = sumG;
        this.turnSpeed = sumB;
        console.log(sumR);
    }

    deathCheck() {
        for (var p = 0; p < this.pixArray.length; p++) {
            if (this.pixArray[p].isDead()) {
                this.pixArray.splice(p, 1);
                console.log(p);
            }
        }
    }
}

var ent = new entity(50,50,0,0,0,0,0,0,0,0,0,0);
ent.pixArray.push(new pixel(0,0,0,0,0,200,0,0));
ent.pixArray.push(new pixel(0,0,0,0,1,200,200,200));
ent.pixArray.push(new pixel(0,0,0,0,2,200,200,200));
ent.pixArray.push(new pixel(0,0,0,0,-1,200,200,200));
ent.pixArray.push(new pixel(0,0,0,1,0,100,100,200));
ent.pixArray.push(new pixel(0,0,0,2,0,100,100,200));
ent.pixArray.push(new pixel(0,0,0,0,-2,200,200,200));
ent.pixArray.push(new pixel(0,0,0,3,0,100,250,100));
ent.pixArray.push(new pixel(0,0,0,3,-1,100,100,200));
ent.draw();

ent.reassessStats();

// var pixArray = new Array(0);
// for (var i = 0; i < 10; i++) {
//     var px = new pixel(0,0,0,20,20,200,0,0);
//     pixArray.push(px);
// }

// pixArray[0].LocationX = 300;
// pixArray[0].LocationY = 300;
// pixArray[0].R = 200;


function MainLoop () {
    // pixArray[0].draw();
    ent.Rotation += Math.PI/30
    // ent.LocationX = MouseX;
    // ent.LocationY = MouseY;
    ent.draw();
}

