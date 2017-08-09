// Javascript Content

// Physics Values --------------------------------

var squareSize = 2; // pixel size (in pixels) (Default = 2.5px)
var spaceFriction = 0.001; // Velocity reduction per physics update
var velocitySnapTol = 0.02; // Min Velocity to snap to 0
var minVelocityToBreak = 0.1; // Minimum velocity required to break;
var borderEjectAccel = (squareSize/8); // Acceleration of ejection from borders
var idealRotScaler = 10; // Divides ideal speed of rotation (Bigger numbers mean slower rotation)

// -----------------------------------------------

// Initial Values

var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");

var popupCanvas = document.getElementById("popupCanvas");
popupCanvas.width = window.innerWidth;
popupCanvas.height = window.innerHeight;
var popCtx = popupCanvas.getContext("2d");

// ++++++++++++++
// Global Values

var MouseX = 0;
var MouseY = 0;
var entityArray = new Array(0);
var userControlledEntity;
var gameState = 0;

// ++++++++++++++

var AiLooping = setInterval(AiLoop, 250);

// var animator = setInterval(MainLoop, 33); // ~30fps
var animator = setInterval(MainLoop, 25); // 40fps
// var animator = setInterval(MainLoop, 20); // 50fps

function frameResized() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    popupCanvas.width = window.innerWidth;
    popupCanvas.height = window.innerHeight;
}
document.addEventListener("resize", frameResized);

function mousePos(event) {
    MouseX = event.clientX;
    MouseY = event.clientY;
    // console.log(MouseX + "," + MouseY);
}
document.addEventListener("mousemove", mousePos);

var thrustFlags = new Array(5);
for (var i = 0; i < thrustFlags.length; i++) {thrustFlags[i] = 0;}
function keyPressed(event) {
    // console.log(event.keyCode + "Pressed");
    switch (event.keyCode) {
        case 87: // W
            thrustFlags[0] = 1;
            break;
        case 65: // A
            thrustFlags[1] = 1;
            break;
        case 83: // S
            thrustFlags[2] = 1;
            break;
        case 68: // D
            thrustFlags[3] = 1;
            break;
        case 16: // Shift
            thrustFlags[4] = 1;
            break;
    }
}
function keyReleased(event) {
    // console.log(event.keyCode + "Released");
    switch (event.keyCode) {
        case 87: // W
            thrustFlags[0] = 0;
            break;
        case 65: // A
            thrustFlags[1] = 0;
            break;
        case 83: // S
            thrustFlags[2] = 0;
            break;
        case 68: // D
            thrustFlags[3] = 0;
            break;
        case 16: // Shift
            thrustFlags[4] = 0;
            break;
    }
}
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);

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
        realX = drawX*Math.cos(this.rotation) + drawY*Math.sin(this.rotation) + this.locationX;
        realY = drawX*Math.sin(this.rotation) - drawY*Math.cos(this.rotation) + this.locationY;
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
                Rotation, TargetRotation, DamageOutput, Thrust, TurnSpeed, Faction, AiState) {
        this.locationX = LocationX;
        this.locationY = LocationY;
        this.velocityX = VelocityX;
        this.velocityY = VelocityY;
        this.accelX = AccelerationX;
        this.accelY = AccelerationY;
        this.rotation = Rotation;
        this.targetRotation = TargetRotation;
        this.damOut = DamageOutput;
        this.thrust = Thrust;
        this.turnSpeed = TurnSpeed;
        this.faction = Faction;
        this.aiState = AiState;

        this.mass = 1;
        this.massyThrust = 0;
        this.massyRotSpeed = 0;
        this.pixArray = new Array(0);
        this.UDLRAccelX = new Array(4);
        this.UDLRAccelY = new Array(4);
        for (var i = 0; i < this.UDLRAccelX.length; i++) {
            this.UDLRAccelX[i] = 0;
            this.UDLRAccelY[i] = 0;
        }
    }

    get Rotation() {return this.rotation;}
    set Rotation(value) {this.rotation = value;}
    get LocationX() {return this.locationX;}
    set LocationX(value) {this.locationX = value;}
    get LocationY() {return this.locationY;}
    set LocationY(value) {this.locationY = value;}

    draw() {
        for (var p = 0; p < this.pixArray.length; p++) {
            this.pixArray[p].LocationX = this.locationX;
            this.pixArray[p].LocationY = this.locationY;
            this.pixArray[p].Rotation = this.rotation;
            this.pixArray[p].draw();
        }
    }

    thrustForwards(percentThrust) {
        var tAcc = this.massyThrust*percentThrust;
        this.UDLRAccelX[0] = Math.cos(this.rotation)*tAcc;
        this.UDLRAccelY[0] = Math.sin(this.rotation)*tAcc;
    }

    thrustLeft(percentThrust) {
        var tAcc = this.massyThrust*percentThrust;
        this.UDLRAccelX[2] = Math.cos(this.rotation - (Math.PI/2))*tAcc;
        this.UDLRAccelY[2] = Math.sin(this.rotation - (Math.PI/2))*tAcc;
    }

    thrustRight(percentThrust) {
        var tAcc = this.massyThrust*percentThrust;
        this.UDLRAccelX[3] = Math.cos(this.rotation + (Math.PI/2))*tAcc;
        this.UDLRAccelY[3] = Math.sin(this.rotation + (Math.PI/2))*tAcc;
    }

    thrustBackwards(percentThrust) {
        var tAcc = this.massyThrust*percentThrust;
        this.UDLRAccelX[1] = Math.cos(this.rotation + (Math.PI))*tAcc;
        this.UDLRAccelY[1] = Math.sin(this.rotation + (Math.PI))*tAcc;
    }

    breakThrust(percentThrust) {
        if (this.velocityX > minVelocityToBreak) {
            this.velocityX -= this.massyThrust;
        } else if (this.velocityX < -minVelocityToBreak) {
            this.velocityX += this.massyThrust;
        }
        if (this.velocityY > minVelocityToBreak) {
            this.velocityY -= this.massyThrust;
        } else if (this.velocityY < -minVelocityToBreak) {
            this.velocityY += this.massyThrust;
        }
    }

    calcRotFromMouse() {
        var mouseRot = Math.atan((MouseY-this.locationY) / (MouseX-this.locationX));
        if (MouseX < this.locationX) {
            mouseRot += Math.PI;
        } else if (MouseY < this.locationY) {
            mouseRot += Math.PI * 2;
        }
        var rotDiffOne = ((mouseRot + Math.PI*2) - (this.rotation % (Math.PI * 2))) % (Math.PI * 2);
        var rotDiffTwo = (mouseRot - (this.rotation % (Math.PI * 2)) - Math.PI*2) % (Math.PI * 2);
        var targetRotVelocity;
        if (rotDiffOne < Math.abs(rotDiffTwo)) {
            targetRotVelocity = rotDiffOne / idealRotScaler;
        } else {
            targetRotVelocity = rotDiffTwo / idealRotScaler;
        }
        // console.log(rotDiffOne*(180/Math.PI) + "|" + rotDiffTwo*(180/Math.PI));

        if (Math.abs(targetRotVelocity) < this.massyRotSpeed) {
            // this.rotation = mouseRot;
            this.rotation += targetRotVelocity;
        } else if (targetRotVelocity > 0) {
            this.rotation += this.massyRotSpeed;
        } else {
            this.rotation -= this.massyRotSpeed;
        }
        // console.log(Math.abs(targetRotVelocity) + " out of " + this.massyRotSpeed);
    }
    
    calcRotToTarget(rotTar) {
        var rotDiffOne = ((rotTar + Math.PI*2) - (this.rotation % (Math.PI * 2))) % (Math.PI * 2);
        var rotDiffTwo = (rotTar - (this.rotation % (Math.PI * 2)) - Math.PI*2) % (Math.PI * 2);
        var targetRotVelocity;
        if (rotDiffOne < Math.abs(rotDiffTwo)) {
            targetRotVelocity = rotDiffOne / idealRotScaler;
        } else {
            targetRotVelocity = rotDiffTwo / idealRotScaler;
        }

        if (Math.abs(targetRotVelocity) < this.massyRotSpeed) {
            // this.rotation = mouseRot;
            this.rotation += targetRotVelocity;
        } else if (targetRotVelocity > 0) {
            this.rotation += this.massyRotSpeed;
        } else {
            this.rotation -= this.massyRotSpeed;
        }
    }

    calcThrust() {
        if (thrustFlags[0] == 1) {this.thrustForwards(1);} else {this.thrustForwards(0);}
        if (thrustFlags[1] == 1) {this.thrustLeft(1);} else {this.thrustLeft(0);}
        if (thrustFlags[2] == 1) {this.thrustBackwards(1);} else {this.thrustBackwards(0);}
        if (thrustFlags[3] == 1) {this.thrustRight(1);} else {this.thrustRight(0);}

        if (thrustFlags[4] == 1) {this.breakThrust();} // Break

        
        if (this.locationX > canvas.width) {this.velocityX -= borderEjectAccel;}
        if (this.locationX < 0) {this.velocityX += borderEjectAccel;}
        if (this.locationY > canvas.height) {this.velocityY -= borderEjectAccel;}
        if (this.locationY < 0) {this.velocityY += borderEjectAccel;}
    }

    calcPhysics() {
        if (this.aiState == 0) { // Only if entity is user controlled
            this.calcRotFromMouse();
        } else {
            calcRotToTarget()
        }
        this.calcThrust();
        this.accelX = this.UDLRAccelX[0] + this.UDLRAccelX[1] + this.UDLRAccelX[2] + this.UDLRAccelX[3];
        this.accelY = this.UDLRAccelY[0] + this.UDLRAccelY[1] + this.UDLRAccelY[2] + this.UDLRAccelY[3];

        this.velocityX += this.accelX;
        this.velocityY += this.accelY;

        this.locationX += this.velocityX;
        this.locationY += this.velocityY;

        // this.rotVelocity += this.rotAccel;
        // this.rotation += this.rotVelocity;

        if (this.velocityX > velocitySnapTol) {
            this.velocityX -= spaceFriction;
        } else if (this.velocityX < -velocitySnapTol) {
            this.velocityX += spaceFriction;
        } else {
            this.velocityX = 0;
        }
        if (this.velocityY > velocitySnapTol) {
            this.velocityY -= spaceFriction;
        } else if (this.velocityY < -velocitySnapTol) {
            this.velocityY += spaceFriction;
        } else {
            this.velocityY = 0;
        }
        // if (this.rotVelocity > rotationSnapTol) {
        //     this.rotVelocity -= rotationFriction;
        // } else if (this.rotVelocity < -rotationFriction) {
        //     this.rotVelocity += rotationFriction;
        // } else {
        //     this.rotVelocity = 0;
        // }
        // console.log("x:" + this.velocityX + " y:" + this.velocityY);
    }

    reassessStats() {
        var sumR = 0; var sumG = 0; var sumB = 0;
        for (var p = 0; p < this.pixArray.length; p++) {
            sumR += parseInt(this.pixArray[p].R);
            sumG += parseInt(this.pixArray[p].G);
            sumB += parseInt(this.pixArray[p].B);
        }
        this.damOut = sumR/100;
        this.thrust = sumG/100;
        this.turnSpeed = (sumB/100) * (Math.PI / 180);
        this.mass = (sumR + sumG + sumB)/100 + this.pixArray.length;
        this.massyThrust = (this.thrust/this.mass)/(20/squareSize);
        this.massyRotSpeed = (Math.PI*5)*((this.turnSpeed/this.mass));
        console.log("Damage:" + this.damOut + " -Thrust:" + this.thrust + " -turnSpeed:" + this.turnSpeed + " -Mass:" + this.mass);
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
/*

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

    var pixArray = new Array(0);
    for (var i = 0; i < 10; i++) {
        var px = new pixel(0,0,0,20,20,200,0,0);
        pixArray.push(px);
    }

    pixArray[0].LocationX = 300;
    pixArray[0].LocationY = 300;
    pixArray[0].R = 200;
*/

function MainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (gameState) {
        case 0: // Primary Game Loop

            break;
        case 1: // Ship Creator Popup (Needs icons)
            
            break;
    }

    for (var e = 0; e < entityArray.length; e++) { // Cycle through entities
        entityArray[e].calcPhysics();
        entityArray[e].draw();
    }
}

function AiLoop() {

}

createEntityFromXML(1, 300, 300, 0, 0, 0);

function createEntityFromXML (id, startX, startY, startRot, factionID, AiState) {
    getXML();
    function getXML() {
        var xhttp;
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
        }
        else {
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.onreadystatechange = function() {
            // console.log("stateChangeTo:" + this.readyState + "   Status:" + this.status);
            if (this.readyState == 4 && this.status == 0) { // change required status to 200 for web access
                // return xhttp.responseXML;
                createEntity(xhttp);
            }
        }
        xhttp.open("GET", "file:///C:/Users/gday/Documents/School/site-templates/DP-TST/ships.xml", true);
        xhttp.send();
    }
    function createEntity(xml) {
        var xmlDoc = xml.responseXML;

        var ent = new entity(startX, startY, 0, 0, 0, 0, startRot, startRot, 0, 0, 0, factionID, AiState);
        if (AiState == 0) {
            userControlledEntity = ent;
        }

        var ship;
        var ships = xmlDoc.getElementsByTagName("ship");
        for (var s = 0; s < ships.length; s++) {
            if (ships[s].getAttribute('id') == id) {
                ship = ships[s];
            }
        }
        var pixels = ship.getElementsByTagName("pixel");
        for (var p = 0; p < pixels.length; p++) {
            var oX = pixels[p].getElementsByTagName("offsetX")[0].firstChild.nodeValue;
            var oY = pixels[p].getElementsByTagName("offsetY")[0].firstChild.nodeValue;
            var r = pixels[p].getElementsByTagName("R")[0].firstChild.nodeValue;
            var g = pixels[p].getElementsByTagName("G")[0].firstChild.nodeValue;
            var b = pixels[p].getElementsByTagName("B")[0].firstChild.nodeValue;
            ent.pixArray.push(new pixel(0,0,0,oX,oY,r,g,b));
            // console.log(oX + " " + oY + " " + r + " " + g + " " + b);
        }
        ent.reassessStats();
        entityArray.push(ent);
    }
}
