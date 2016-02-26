$(document).ready(function() {
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");

	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Game settings
	var playGame;
	var asteroids;
	var numAsteroids;
	var player;
	var lasers;
	var deadAsteroids;
	var deadLasers;
	var laserCount = 0;
	var score;
	var scoreTimeout;
	var point;
	var pointTimeout;
	var arrowUp = 38;
	var arrowRight = 39;
	var arrowDown = 40;
	var space = 32; // SPACE TO SHOOT

	// Game UI
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $(".gameReset");
	var uiScore = $(".gameScore");
	var uiPoint = $(".gamePoint");
	var soundBackground = $("#gameSoundBackground").get(0);
	var soundThrust = $("#gameSoundThrust").get(0);
	var soundDeath = $("#gameSoundDeath").get(0);
	var soundLaserbeam = $("#gameSoundLaserbeam").get(0);

	var Asteroid = function(x, y, radius, vX) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.vX = vX;
	};

	var Player = function(x, y) {
		this.x = x;
		this.y = y;
		this.width = 24;
		this.height = 24;
		this.halfWidth = this.width/2
		this.halfHeight = this.height/2

		this.vX = 0;
		this.vY = 0;

		this.moveRight = false;
		this.moveUp = false;
		this.moveDown = false;
		this.shoot = false;
		this.flameLength = 20;
	};

	var Laser = function (x, y, radius, vX, active) {
		this.x = x;
		this.y = y;
		this.radius = radius;

		this.vX = vX;
		this.active = active;
	}

	// Reset and start the game
	function startGame() {
		// Reset game stats
		uiScore.html("0");
		uiPoint.html("0");
		uiStats.show();

		// Set up initial game settings
		playGame = false;

		asteroids = new Array();
		lasers = new Array();
		deadAsteroids = new Array();
		deadLasers = new Array();
		numAsteroids = 10;
		score = 0;
		point = 0;

		player = new Player(150, canvasHeight/2);

		for (var i = 0; i < numAsteroids; i++) {
			var radius = 5+(Math.random()*10); // Between 5 and 15
			var x = canvasWidth+radius+Math.floor(Math.random()*canvasWidth); // Between right screen edge and 2 screens right
			var y = Math.floor(Math.random()*canvasHeight); // Anywhere along canvas height
			var vX = -5-(Math.random()*5); // Between -5 and -10

			asteroids.push(new Asteroid(x, y, radius, vX));
		};
		$(window).keydown(function(e) {
			var keyCode = e.keyCode;

			if (!playGame) {
				playGame = true; // Start the game only when player moves
				soundBackground.currentTime = 0;
				soundBackground.play();
				animate();
				timer();
			};

			if (keyCode == arrowRight) {
				player.moveRight = true;
				if (soundThrust.paused) { // Checks if thrust sound still being played and if so, stops from playing it a second time
					soundThrust.currentTime = 0;
					soundThrust.play();
				};
			} else if (keyCode == arrowUp) {
				player.moveUp = true;
			} else if (keyCode == arrowDown) {
				player.moveDown = true;
			};
			if (keyCode == space) { // initialize laser here when space is pressed
				player.shoot = true;
				laserCount++;
				for (var i = 0; i < 1; i++) {
					var x = player.x + player.halfWidth;
					var y = player.y;
					var radius = 5;
					var vX = 0.5;
					var active = true;
					lasers.push(new Laser(x, y, radius, vX, true));
				};
				soundLaserbeam.currentTime = 0;
				soundLaserbeam.play();
			};
		});

		$(window).keyup(function(e) {
			var keyCode = e.keyCode;

			if (keyCode == arrowRight) {
				player.moveRight = false;
				soundThrust.pause();
			} else if (keyCode == arrowUp) {
				player.moveUp = false;
			} else if (keyCode == arrowDown) {
				player.moveDown = false;
			};
			if (keyCode == space) {
				player.shoot = false;
			};
		});
		// Start animation loop
		animate();
	};

	// Initialize the game environment
	function init() {
		uiStats.hide();
		uiComplete.hide();

		uiPlay.click(function(e) {
			e.preventDefault();
			uiIntro.hide();
			startGame();
		});

		uiReset.click(function(e) {
			e.preventDefault();
			uiComplete.hide();
			soundThrust.pause();
			soundBackground.pause(); // we want death sound to play over gameover screen so don't include it here
			soundLaserbeam.pause();
			$(window).off("keyup");
			$(window).off("keydown");
			clearTimeout(scoreTimeout); // reset timer to 0 when we reset
			startGame();
		});
	};

	// Recycle asteroids with new dimensions so looks like side-scroller
	function recycleAsteroid(object) {
		if (object.x+object.radius < 0) {
			object.radius = 5+(Math.random()*10);
			object.x = canvasWidth+object.radius;
			object.y = Math.floor(Math.random()*canvasHeight);
			object.vX = -5-(Math.random()*5);
		};
	}

	function playerBoundary(object) {
		if (object.x-object.halfWidth < 20) { // left
			object.x = 20+object.halfWidth;
		} else if (object.x+object.halfWidth > canvasWidth-20) { // right
			object.x = canvasWidth-20-object.halfWidth;
		};
		if (object.y-object.halfHeight < 20) { // top
			object.y = 20+object.halfHeight;
		} else if (object.y+object.halfHeight > canvasHeight-20) { // bottom
			object.y = canvasHeight-20-object.halfHeight;
		};
	}

	function timer() {
		if (playGame) {
			scoreTimeout = setTimeout(function() {
				uiScore.html(score++);
				if (score%5 == 0) {
					numAsteroids += 5;
				};
				timer(); // so repeatedly updates 1 score (ie. 1 second) every second as time goes on until game is ended
			}, 1000);
		};
	};

	// Animation loop that does all the fun stuff
	function animate() {
		// Clear
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		var asteroidsLength = asteroids.length;
		var laserAmount = lasers.length;
		for (var i = 0; i < asteroidsLength; i++) {
			var tmpAsteroid = asteroids[i];
			tmpAsteroid.x += tmpAsteroid.vX;
			recycleAsteroid(tmpAsteroid);

			for (var j = 0; j < laserAmount; j++) {
				var tmpLaser = lasers[j];
				tmpLaser.x += tmpLaser.vX; // Move the laser

				// Draw laser
				if (tmpLaser.active) {
					context.fillStyle = "blue";
					context.beginPath();
					context.arc(tmpLaser.x, tmpLaser.y, tmpLaser.radius, 0, Math.PI*2, true);
					context.closePath();
					context.fill();
				};

				// Detecting laser and asteroid collision
				var dXl = tmpLaser.x - tmpAsteroid.x;
				var dYl = tmpLaser.y - tmpAsteroid.y;
				var distancel = Math.sqrt((dXl*dXl)+(dYl*dYl));
				if (distancel < tmpLaser.radius + tmpAsteroid.radius) {
					if (tmpAsteroid.radius < 9) { // If we hit a small sized asteroid, get 10 points
						uiPoint.html(point+=10);
					}
					else if (tmpAsteroid.radius < 12) { // If we hit a medium sized asteroid, get 5 points
						uiPoint.html(point+=5);
					}
					else
						uiPoint.html(point+=2); // If we hit large sized asteroid, get 2 points

					tmpLaser.active = false;
					laserCount--;
					tmpLaser.y = canvasHeight+20;
					tmpAsteroid.radius = 0;
					deadAsteroids.push(tmpAsteroid);
					deadLasers.push(tmpLaser);
				};
			};
			var deadLasersLength = deadLasers.length;
			if (deadLasersLength > 0) {
				for (var dj = 0; dj < deadAsteroidsLength; dj++) {
					var tmpDeadLaser = deadLasers[dj];
					lasers.splice(lasers.indexOf(tmpDeadLaser),1);
				};
			};

			// Detecting asteroid collision (use circle on our rocket for collision detection)
			var dX = player.x - tmpAsteroid.x;
			var dY = player.y - tmpAsteroid.y;
			var distance = Math.sqrt((dX*dX)+(dY*dY));

			if (distance < player.halfWidth+tmpAsteroid.radius) {
				soundThrust.pause();
				soundDeath.currentTime = 0;
				soundDeath.play();
				// Game over
				playGame = false;
				clearTimeout(scoreTimeout);
				uiStats.hide();
				uiComplete.show();

				$(window).off("keyup");
				$(window).off("keydown");
			};

			// Draw asteroid
			context.fillStyle = "rgb(255, 255, 255)";
			context.beginPath();
			context.arc(tmpAsteroid.x, tmpAsteroid.y, tmpAsteroid.radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		};
		var deadAsteroidsLength = deadAsteroids.length;
		if (deadAsteroidsLength > 0) {
			for (var di = 0; di < deadAsteroidsLength; di++) {
				var tmpDeadAsteroid = deadAsteroids[di];
				asteroids.splice(asteroids.indexOf(tmpDeadAsteroid), 1); 
			};
		};

		player.vX = 0;
		player.vY = 0;

		if (player.moveRight) {
			player.vX = 3;
		} else {
			player.vX = -3;
		};

		if (player.moveUp) {
			player.vY = -3;
		};

		if (player.moveDown) {
			player.vY = 3;
		};

		// New position after moving
		player.x += player.vX;
		player.y += player.vY;

		playerBoundary(player);

		// Rocket flame
		if (player.moveRight) {
			context.save();
			context.translate(player.x-player.halfWidth, player.y);

			if (player.flameLength == 20) {
				player.flameLength = 15; // Every loop, length changes 20 to 15, n back n forth
			} else {
				player.flameLength = 20;
			};
			// Draw flame
			context.fillStyle = "orange";
			context.beginPath();
			context.moveTo(0, -5);
			context.lineTo(-player.flameLength, 0);
			context.lineTo(0, 5);
			context.closePath();
			context.fill();

			context.restore();
		};

		// Draw rocket
		context.fillStyle = "rgb(255, 0, 0)";
		context.beginPath();
		context.moveTo(player.x+player.halfWidth, player.y);
		context.lineTo(player.x-player.halfWidth, player.y-player.halfHeight);
		context.lineTo(player.x-player.halfWidth, player.y+player.halfHeight);
		context.closePath();
		context.fill();
		// Adds asteroids every animation loop until the asteroids are equal
		while (asteroids.length < numAsteroids) {
			var radius = 5+(Math.random()*10);
			var x = Math.floor(Math.random()*canvasWidth)+canvasWidth+radius;
			var y = Math.floor(Math.random()*canvasHeight);
			var vX = -5-(Math.random()*5);

			asteroids.push(new Asteroid(x, y, radius, vX));
		};
		

		if (playGame) {
			// Run the animation loop again in 33 milliseconds
			setTimeout(animate, 33);
		};
	};

	init();
});