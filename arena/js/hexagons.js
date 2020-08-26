(function(){
	var canvas = document.getElementById('hexmap');

	var hexHeight,
		hexRadius,
		hexRectangleHeight,
		hexRectangleWidth,
		hexagonAngle = 0.523598776, // 30 degrees in radians
		sideLength = 30,
		boardWidth = 10,
		boardHeight = 11,
		oldScreenX = -1,
		oldScreenY = -1;

	hexHeight = Math.sin(hexagonAngle) * sideLength;
	hexRadius = Math.cos(hexagonAngle) * sideLength;
	hexRectangleHeight = sideLength + 2 * hexHeight;
	hexRectangleWidth = 2 * hexRadius;

	if(canvas.getContext) {
		var ctx = canvas.getContext('2d');

		ctx.fillStyle = "#000000";
		ctx.strokeStyle = "#CCCCCC";
		ctx.lineWidth = 1;

		drawBoard(ctx, boardWidth, boardHeight);

		canvas.addEventListener("mousemove", function(eventInfo) {
			var x,
				y,
				hexX,
				hexY,
				screenX,
				screenY,
				rect;

			rect = canvas.getBoundingClientRect();

			x = eventInfo.clientX - rect.left;
			y = eventInfo.clientY - rect.top;

			hexY = Math.floor(y / (hexHeight + sideLength));
			hexX = Math.floor((x - (hexY % 2) * hexRadius) / hexRectangleWidth);

			screenX = hexX * hexRectangleWidth + ((hexY % 2) * hexRadius);
			screenY = hexY * (hexHeight + sideLength);

			//ctx.clearRect(0, 0, canvas.width, canvas.height);

			//drawBoard(ctx, boardWidth, boardHeight);

			// are the mouse's coords on the board?
			if(hexX >= 0 && hexX < boardWidth) {
				if(hexY >= 0 && hexY < boardHeight) {
					if(oldScreenX != -1 && oldScreenY != -1) {
						ctx.fillStyle = "#FFFFFF";
						drawHexagon(ctx, oldScreenX, oldScreenY, true);
					}
					ctx.fillStyle = "#434343";
					drawHexagon(ctx, screenX, screenY, true);
					oldScreenX = screenX;
					oldScreenY = screenY;
				}
			}
		});
	}

	function drawBoard(canvasContext, width, height) {
		var i,
			j;

		for(i = 0; i < width; ++i) {
			for(j = 0; j < height; ++j) {
				drawHexagon(
					ctx,
					i * hexRectangleWidth + ((j % 2) * hexRadius),
					j * (sideLength + hexHeight),
					false
					);
			}
		}
	}

	function drawHexagon(canvasContext, x, y, fill) {
		var fill = fill || false;

		canvasContext.beginPath();
		canvasContext.moveTo(x + hexRadius, y);
		canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight);
		canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
		canvasContext.lineTo(x + hexRadius, y + hexRectangleHeight);
		canvasContext.lineTo(x, y + sideLength + hexHeight);
		canvasContext.lineTo(x, y + hexHeight);
		canvasContext.closePath();

		if(fill) {
			canvasContext.fill();
		}
		else {
			canvasContext.stroke();
		}
	}

})();