(function(){

	var box2dUtils;		// classe utilitaire
	var world; 			// "monde" 2dbox
	var canvas;			// notre canvas
	var canvasWidth;	// largeur du canvas
	var canvasHeight;	// hauteur du canvas
	var context;		// contexte 2d
	var SCALE = 30;		// échelle
	
	// "Includes" box2dweb
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2AABB = Box2D.Collision.b2AABB;
	var b2Body = Box2D.Dynamics.b2Body;
	
	// Gestion de la souris
	var mouseX = undefined; // position x de la souris
	var mouseY = undefined;	// position y de la souris
	var mouseVec; // les coordonnées de la souris sous forme de vecteur (b2Vec2)
	var isMouseDown = false; // le clic est-il enfoncé ?
	var mouseJoint = false; // la liaison de type "souris"
	var canvasPosition; // la position du canvas
	var selectedBody; // le body sélectionné

	// Initialisation
	$(document).ready(function() {
		init();
	});

	// Lancer à l'initialisation de la page
	this.init = function() {

		box2dUtils = new Box2dUtils(SCALE);	// instancier la classe utilitaire

		// Récupérer la canvas, ses propriétés et le contexte 2d
		canvas = $('#gipCanvas').get(0);
		canvasWidth = parseInt(canvas.width);
		canvasHeight = parseInt(canvas.height);
		canvasPosition = $(canvas).position();
		context = canvas.getContext('2d');

		world = box2dUtils.createWorld(context); // box2DWorld
		
		// Lancer l'exemple "Mouse Joint"
		setExempleMouseJoint();
		
		// Exécuter le rendu de l'environnement 2d
		window.setInterval(update, 1000 / 60);
				
		// Ajouter les listeners d'événements souris	
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		
		// Désactiver les scrollings vertical lors d'un appui sur les touches directionnelles "haut" et "bas"
		document.onkeydown = function(event) {
			return event.keyCode != 38 && event.keyCode != 40;
		}
	}
	
	// Gestion de l'événement "Mouse Down"
	this.handleMouseDown = function(evt) {
		isMouseDown = true;
		handleMouseMove(evt);
		window.addEventListener('mousemove', handleMouseMove);
	}
	

	// Gestion de l'événement "Mouse Up"
	this.handleMouseUp = function(evt) {
		window.removeEventListener('mousemove', handleMouseMove);
		isMouseDown = false;
		mouseX = undefined;
		mouseY = undefined;
	}
	
	// Gestion de l'événement "Mouse Move"
	this.handleMouseMove = function(evt) {
		mouseX = (evt.clientX - canvasPosition.left) / SCALE;
		mouseY = (evt.clientY - canvasPosition.top) / SCALE;
	}
	
	// Récupérer le body cliqué
	this.getBodyAtMouse = function() {
		selectedBody = null;
		mouseVec = new b2Vec2(mouseX, mouseY);
		var aabb = new b2AABB();
		aabb.lowerBound.Set(mouseX, mouseY);
		aabb.upperBound.Set(mouseX, mouseY);
		world.QueryAABB(getBodyCallBack, aabb);
		return selectedBody;
	}
	
	// Callback de getBody -> QueryAABB
	this.getBodyCallBack = function(fixture) {
        if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
            if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mouseVec)) {
               selectedBody = fixture.GetBody();
               return false;
            }
        }
        return true;
	}

	// Mettre à jour le rendu de l'environnement 2d
	this.update = function() {
		// Mouse Down et pas de liaison
		if (isMouseDown && (!mouseJoint)) {
			var body = getBodyAtMouse();
            if (body) {
            	mouseJoint = box2dUtils.createMouseJoint(world, body, mouseX, mouseY);
            	body.SetAwake(true);
            }
        }
        // Liaison existante
		if (mouseJoint) {
        	if (isMouseDown) {
        		mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
            } else {
            	world.DestroyJoint(mouseJoint);
            	mouseJoint = null;
            }
        }
        // effectuer les simulations physiques et mettre à jour le canvas
		world.Step(1 / 60,  10, 10);
		world.DrawDebugData();
		world.ClearForces();
	}

	// Créer les limites de l'environnement
	this.setWorldBounds = function() {
		// Créer le "sol" et le "plafond" de notre environnement physique
		ground = box2dUtils.createBox(world, 400, canvasHeight - 10, 400, 10, null, true, 'ground');
		ceiling = box2dUtils.createBox(world, 400, -5, 400, 1, null, true, 'ceiling');
		
		// Créer les "murs" de notre environnement physique
		leftWall = box2dUtils.createBox(world, -5, canvasHeight, 1, canvasHeight, null, true, 'leftWall');
		leftWall = box2dUtils.createBox(world, canvasWidth + 5, canvasHeight, 1, canvasHeight, null, true, 'leftWall');
	}
	
	// Lancer l'exemple de liaison "souris"
	this.setExempleMouseJoint = function() {
		setWorldBounds();
		
		// Créer 2 box statiques
		box2dUtils.createBox(world, 600, 450, 50, 50, null, true, 'staticBox');
		box2dUtils.createBox(world, 200, 250, 80, 30, null, true, 'staticBox2');

		// Créer 2 ball statiques
		box2dUtils.createBall(world, 50, 400, 50, true, 'staticBall');
		box2dUtils.createBall(world, 500, 150, 60, true, 'staticBall2');
		
		// Créer 20 éléments ball dynamiques de différentes tailles
		for (var i=0; i<30; i++) {
			var radius = 20;
			if (i < 10) {
				radius = 15;
			}
			// Placer aléatoirement les objets dans le canvas
			box2dUtils.createBall(world,
					Math.random() * canvasWidth,
					Math.random() * canvasHeight - 400 / SCALE,
					radius, false, 'ball'+i);
		}

		// Créer 20 éléments box dynamiques de différentes tailles
		for (var i=0; i<30; i++) {
			var length = 20;
			if (i < 10) {
				length = 15;
			}
			// Placer aléatoirement les objets dans le canvas
			box2dUtils.createBox(world,
					Math.random() * canvasWidth,
					Math.random() * canvasHeight - 400 / SCALE,
					length, length, null, false, 'box'+i);
		}
	}

}());