
/* Viewer.js file 
Includes viewer class responsible to create viewer and hold functions related to functionalities
*/


import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { Annotation } from './annotations.js'

var completeViewer = null;

function create() {

    completeViewer = new Viewer();
    createUI();
    completeViewer.createViewer();
    completeViewer.animate();
}

function createUI() {
    const para = document.createElement("div");
    para.id = "info";
    const button1 = document.createElement("button");
    button1.id = "description1";
    button1.className = "description";
    button1.innerHTML = "Rotate"
    button1.onclick = () => {
        removeAllEventListeners();
        completeViewer.annotation.dispose();
        removeOtherGeometries();
        completeViewer.setRotation(completeViewer.ifRotationActive);
    };

    const button2 = document.createElement("button");
    button2.id = "description2";
    button2.className = "description";
    button2.innerHTML = "Distance"
    button2.onclick = () => {
        removeAllEventListeners();
        completeViewer.annotation.dispose();
        removeOtherGeometries();
        document.addEventListener("mousedown", completeViewer.onDocumentMouseDownForDistance.bind(completeViewer), false);
    };

    const button3 = document.createElement("button");
    button3.id = "description3";
    button3.className = "description";
    button3.innerHTML = "Angle"
    button3.onclick = () => {
        removeAllEventListeners();
        completeViewer.annotation.dispose();
        removeOtherGeometries();
        document.addEventListener("mousedown", completeViewer.onDocumentMouseDownForAngle.bind(completeViewer), false);
    };

    const button4 = document.createElement("button");
    button4.id = "description4";
    button4.className = "description";
    button4.innerHTML = "Annotations"
    button4.onclick = () => {
        removeAllEventListeners();
        removeOtherGeometries();
        completeViewer.startAnnotation();
    };
    para.appendChild(button1);
    para.appendChild(button2);
    para.appendChild(button3);
    para.appendChild(button4);
    document.body.appendChild(para);
}


//function to remove previous added geometries such as line or sphereGeometry
function removeOtherGeometries() {
    completeViewer.scene.traverse(function (child) {
        if (child.geometry) 
            if (child.type === "Line" && child.name === "DefaultAnnotationLine") {
                child.visible = false;
            }
        
    });
}



function removeAllEventListeners() {
    document.getElementById("description4").removeEventListener("mousedown", completeViewer.onDocumentMouseDownForAnnotations.bind(completeViewer));
    document.getElementById("description3").removeEventListener("mousedown", completeViewer.onDocumentMouseDownForAngle.bind(completeViewer));
    document.getElementById("description2").removeEventListener("mousedown", completeViewer.onDocumentMouseDownForDistance.bind(completeViewer));
}
class Viewer {

    constructor() {
        this.camera = null;
        this.controls = null;
        this.container = null;
        this.scene = null;
        this.lights = null;
        this.renderer = null;
        this.mouse = null;
        this.raycaster = null;
        this.widthO = 1280;
        this.heightO = 680;
        this.ifRotationActive = false;
        this.sceneObject = null;
        this.annotation = new Annotation();
    }

    createViewer() {
        //container
        this.container = document.getElementById('canvas');
        document.body.appendChild(this.container);

        //renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.widthO, this.heightO);
        this.renderer.setClearColor(0x404040);
        this.container.appendChild(this.renderer.domElement);

        //scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe5e5e5);

        //camera
        this.camera = new THREE.PerspectiveCamera(45, this.widthO / this.heightO, 10, 10000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(this.scene.position)
        this.scene.add(this.camera);
        this.mouse = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.lights = new THREE.AmbientLight(0x404040);
        this.scene.add(this.lights);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        //Window Resize Event
        window.addEventListener('resize', this.onWindowResize, false);
        this.renderer.setSize(this.widthO, this.heightO);
        this.loadStlFile();
        this.getDistanceOfTwoPoints();
        this.getAngleOfTwoPoints();
    }

    onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

    }

    loadStlFile() {
        var _this = this;
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xdce6dd,
            metalness: 0.25,
            roughness: 0.1,
            opacity: 1.0,
            transparent: true,
            transmission: 0.99,
            clearcoat: 1.0,
            clearcoatRoughness: 0.25
        })
        const loader = new STLLoader()
        loader.load(
            'models/teeth.stl',
            function (geometry) {
                _this.sceneObject = new THREE.Mesh(geometry, material)
                _this.sceneObject.position.set(0, 0, 0);
                _this.camera.position.set(153.55303273369356, -151.83856811239386, -152.4917370491029);
                _this.controls.target.set(152.78357903772365, 54.55304798083163, -57.03357051745214)
                _this.controls.update();
                _this.scene.add(_this.sceneObject)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
    }

    getDistanceOfTwoPoints() {
        var _this = this;
        _this.points = [
            new THREE.Vector3(),
            new THREE.Vector3()
        ]
        _this.clicks = 0;

        _this.markerA = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 10, 20),
            new THREE.MeshBasicMaterial({
                color: 0xff5555
            })
        );
        _this.markerA.scale.set(10, 10, 10)
        _this.markerB = _this.markerA.clone();
        _this.markers = [
            _this.markerA, _this.markerB
        ];
        _this.scene.add(_this.markerA);
        _this.scene.add(_this.markerB);

        var lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff5555
        });
        _this.line = new THREE.Line(lineGeometry, lineMaterial);
        _this.scene.add(_this.line);

    }

    setLine(vectorA, vectorB) {
        this.line.geometry.attributes.position.setXYZ(0, vectorA.x, vectorA.y, vectorA.z);
        this.line.geometry.attributes.position.setXYZ(1, vectorB.x, vectorB.y, vectorB.z);
        this.line.geometry.attributes.position.needsUpdate = true;
    }


    getIntersections(event) {
        var vector = new THREE.Vector3();

        vector.set(
            event.clientX / window.innerWidth * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(vector, this.camera);

        var intersects = raycaster.intersectObject(this.sceneObject);

        return intersects;
    }

    onDocumentMouseDownForDistance(event) {
        console.log("onDocumentMouseDownForDistance")
        var _this = this;
        var intersects = this.getIntersections(event);

        if (intersects.length > 0) {
            console.log(intersects)

            if (_this.points[_this.clicks] && intersects[0].point) {
                let distancePlace = document.getElementById("valueDist");
                _this.points[_this.clicks].copy(intersects[0].point);
                _this.markers[_this.clicks].position.copy(intersects[0].point);
                this.setLine(intersects[0].point, intersects[0].point);
                _this.clicks++;
                if (_this.clicks > 1) {
                    var distance = _this.points[0].distanceTo(_this.points[1]);
                    distancePlace.innerText = distance;
                    _this.setLine(_this.points[0], _this.points[1]);
                    _this.clicks = 0;
                }
            }

        }
    }

    getAngleOfTwoPoints() {
        var _this = this;
        _this.points1 = [
            new THREE.Vector3(),
            new THREE.Vector3()
        ]
        _this.clicks1 = 0;

        _this.markerC = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 10, 20),
            new THREE.MeshBasicMaterial({
                color: 0xff5555
            })
        );
        _this.markerC.scale.set(10, 10, 10)
        _this.markerD = _this.markerC.clone();
        _this.markers1 = [
            _this.markerC, _this.markerD
        ];
        _this.scene.add(_this.markerC);
        _this.scene.add(_this.markerD);

        var lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff5555
        });
        _this.line1 = new THREE.Line(lineGeometry, lineMaterial);
        _this.scene.add(_this.line);

    }

    setAngle(vectorA, vectorB) {
        this.line1.geometry.attributes.position.setXYZ(0, vectorA.x, vectorA.y, vectorA.z);
        this.line1.geometry.attributes.position.setXYZ(1, vectorB.x, vectorB.y, vectorB.z);
        this.line1.geometry.attributes.position.needsUpdate = true;
    }


    onDocumentMouseDownForAngle(event) {
        var _this = this;
        var intersects = this.getIntersections(event);

        if (intersects.length > 0) {

            if (_this.points1[_this.clicks1] && intersects[0].point) {
                let distancePlace = document.getElementById("valueAngle");
                _this.points1[_this.clicks1].copy(intersects[0].point);
                _this.markers1[_this.clicks1].position.copy(intersects[0].point);
                this.setAngle(intersects[0].point, intersects[0].point);
                _this.clicks1++;
                if (_this.clicks1 > 1) {
                    var distance = _this.points1[0].angleTo(_this.points1[1]);;
                    var angle = THREE.MathUtils.radToDeg(distance);
                    distancePlace.innerText = angle;
                    _this.setAngle(_this.points1[0], _this.points1[1]);
                    _this.clicks = 0;
                }
            }

        }
    }

    onDocumentMouseDownForAnnotations(event) {
        console.log("onDocumentMouseDownForAnnotations")
    }


    animate() {

        "use strict"
        if (this.animate) {
            this.frameId = requestAnimationFrame(this.animate.bind(this));
        }
        this.render();

    }

    render() {

        this.renderer.render(this.scene, this.camera);

    }

    setRotation() {
        if (!this.ifRotationActive) {
            this.ifRotationActive = true;
            this.startRotation();
        } else {
            this.ifRotationActive = false;
            this.stopRotation();
        }
    }

    startRotation() {
        requestAnimationFrame(this.startRotation.bind(this));
        if (this.sceneObject)
            this.sceneObject.rotation.y += 0.01;
    };

    stopRotation() {
        requestAnimationFrame(this.stopRotation.bind(this));
        if (this.sceneObject)
            this.sceneObject.rotation.y = 0;

    };

    setRayCaster(event) {
        var vector = new THREE.Vector3();

        vector.set(
            event.clientX / window.innerWidth * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        this.raycaster = new THREE.Raycaster();
        this.raycaster.setFromCamera(vector, this.camera);

    }

    removeDOMElementsById(elements) {
        for (let i = 0; i < elements.length; i++) {
            let e = document.getElementById(elements[i]);
            if (e) e.parentNode.removeChild(e);
        }
    }

    getIntersectedObject(event, object) {
        this.setRayCaster(event)
        return this.raycaster.intersectObject(object, true);
    }
    addInputsUI(event) {
        this.annotationLeft = event.clientX + 'px';
        this.annotationTop = event.clientY + 'px';
        var _this = this.annotation;
        var annotationDiv = document.createElement("div");
        annotationDiv.id = "annotation-div";
        var annotationContent = document.createElement("div");
        annotationContent.id = "annotation-content";

        var helpdiv = document.createElement("div");
        helpdiv.innerText = "Fill text fields and press 'Enter'";
        helpdiv.style = "text-align: center; margin: 10px";
        annotationContent.appendChild(helpdiv);

        var annotationInput = document.createElement("input");
        annotationInput.id = "annotation-text";
        annotationInput.type = "text";
        annotationInput.placeholder = "Enter Text";
        annotationInput.value = _this.annotationPart.name;
        annotationInput.onfocus = function () {
            var annotationMsg = document.getElementsByClassName("annotation-message")[0];
            if (annotationMsg)
                annotationContent.removeChild(annotationMsg);
        }

        annotationContent.appendChild(annotationInput);
        annotationContent.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        this.annotationLeft = event.clientX + 'px';
        this.annotationTop = event.clientY + 'px';
        annotationContent.style.left = event.clientX + 'px';
        annotationContent.style.top = event.clientY + 'px';
        annotationDiv.appendChild(annotationContent);
        document.body.appendChild(annotationDiv);
        window.addEventListener("click", this.undoAnnotation.bind(this), false);
        window.addEventListener("keydown", this.addAnnotationElement.bind(this), false);
        annotationInput.focus();

    }
    addAnnotationElement(event) {
        event.stopPropagation();
        if (event.keyCode === 13) {

            //event.target.blur();    
            try {

                var element1 = document.getElementById("annotation-hplink");
                var element2 = document.getElementById("annotation-img-url");
                var element3 = document.getElementById("annotation-text");
                var element4 = document.getElementById("annotation-content");
                var element5 = document.getElementById("annotation-img-height");
                var element6 = document.getElementById("annotation-img-width");
                if (document.getElementById("annotation-actionType") != null) {
                    var element7 = document.getElementById("annotation-actionType").value;
                }

                if (!element4) return;

                var _this = this.annotation;
                var hyperlink = "";
                var imgURL = "";
                var imageH = "";
                var imageW = "";
                var aText = "";

                if (element1) hyperlink = element1.value.trim();

                if (element2) imgURL = element2.value.trim();

                if (element3) aText = element3.value.trim();

                let div = document.createElement("div");
                div.id = "divAnnotId"
                div.className = "annotation-message";

                let divAnnotMsg = document.getElementById("divAnnotId");
                if (imgURL === '' && aText === '' && element7 != "Animation") {
                    let div = document.createElement("div");
                    div.id = "divAnnotId"
                    div.className = "annotation-message";
                    if (_this.add3DAnnotation) {
                        div.innerText = "Select from dropdown and \nenter respective URL";
                    }
                    else {
                        div.innerText = "Fill at least one text field or image field.";
                    }
                    div.style = "text-align: center; color: rgb(255, 0, 0); margin: 10px";
                    if (!divAnnotMsg) {
                        element4.appendChild(div);
                    }


                } else {

                    if (!_this.annotationPart.userData.hasOwnProperty('annotationNo')) {
                        _this.annotationPart.userData.annotationNo = 1;
                    } else {
                        _this.annotationPart.userData.annotationNo++;
                    }

                    let imageWidth;

                    if (element5 && element5.value !== '') {
                        imageH = element5.value;
                    } else {
                        imageH = "100";
                    }

                    if (element6 && element6.value) {
                        imageWidth = imageW = element6.value;
                    } else {
                        imageW = "100";
                        imageWidth = "50";
                    }

                    if (_this.add3DAnnotation === true && _this.hotspot) {
                        const newHotspot = _this.hotspot.clone();
                        _this.hotspot.material = _this.hotspot.material.clone();    //Added to have separate material for each sprite
                        let position = new Vector3(_this.annotationLine.geometry.getAttribute("position").array[3], _this.annotationLine.geometry.getAttribute("position").array[4], _this.annotationLine.geometry.getAttribute("position").array[5])
                        newHotspot.position.copy(position);
                        newHotspot.scale.set(_this.hotspotScaleValue, _this.hotspotScaleValue, _this.hotspotScaleValue);

                        _this.annotationPart.add(newHotspot);
                        _this.annotationLine.parent.remove(_this.annotationLine);

                        var _Width = imageWidth;
                        var actionType = document.getElementById("annotation-actionType").value;

                        imgURL = imgURL.split(" ").join("");
                        var content = imgURL.split(',');
                        var _UserData = "";
                        var pos = newHotspot.position;
                        var scale = _this.hotspotScaleValue;

                        if (content == "") {
                            content = [];
                        }

                        let hotspotObject = new Hotspot(newHotspot.uuid, "", pos, _Width, actionType, content, _UserData, scale);

                        if (cdsStudioObject.hotspotList[_this.annotationPart.userData.compId] != undefined) {
                            cdsStudioObject.hotspotList[_this.annotationPart.userData.compId].push(hotspotObject);
                            newHotspot.userData.index = cdsStudioObject.hotspotList[_this.annotationPart.userData.compId].indexOf(hotspotObject);

                        }
                        else {
                            cdsStudioObject.hotspotList[_this.annotationPart.userData.compId] = [];
                            cdsStudioObject.hotspotList[_this.annotationPart.userData.compId].push(hotspotObject);
                            newHotspot.userData.index = cdsStudioObject.hotspotList[_this.annotationPart.userData.compId].indexOf(hotspotObject);

                        }

                        //==========================================================
                    } else {
                        var id = Math.floor(Math.random() * 100)
                        var annotation = _this.getAnnotationDiv(id + "." + (_this.annotationPart.userData.annotationNo - 1), aText, hyperlink, imgURL, imageW, imageH)

                        //Annotation Factory
                        if (!_this.annotationContainer.hasOwnProperty(id)) {
                            _this.annotationContainer[id] = { part: null, annotations: [] };
                        }

                        _this.annotationContainer[id]["part"] = _this.annotationPart;
                        _this.annotationContainer[id]["annotations"].push({ domElement: annotation, line: _this.annotationLine, data: { text: aText, url: hyperlink, imageUrl: imgURL, imageHeight: imageH, imageWidth: imageW }, animationTimeFrames: [], explosionEndOnly: false });
                    }

                    this.sceneObject.userData.hasAnnotation = true;

                    _this.annotationLine = null;
                    _this.annotationPart = null;

                    window.removeEventListener("click", _this.undoAnnotation, false);
                    window.removeEventListener("keydown", _this.addAnnotationElement, false);


                    var annotationDiv = document.getElementById("annotation-div");
                    if (annotationDiv) {
                        annotationDiv.parentElement.removeChild(annotationDiv);
                    }
                }
            } catch (e) {
                console.log("Annotation error: " + e);
            }
        }
        this.updateAnnotation(id);
    }

    undoAnnotation(event) {
        var _this = this.annotation;
        var annotationDiv = document.getElementById("annotation-div");
        if (event.target === annotationDiv) {
            var _this = _this.annotation;
            var annotationDiv = document.getElementById("annotation-div");
            annotationDiv.parentElement.removeChild(annotationDiv);

            if (_this.annotationLine) _this.annotationLine.parent.remove(_this.annotationLine);

            _this.selectedSprite = null;

            _this.annotationLine = null;
            _this.annotationPart = null;

            window.removeEventListener("click", _this.undoAnnotation, false);
            window.removeEventListener("keydown", _this.addAnnotationElement, false);
        }
    }
    updateAnnotation(cId) {
        var _this = this.annotation;
        if (_this.annotationContainer[cId]) {
            var point = _this.annotationContainer[cId].annotations[0].line.geometry.getAttribute('position').array;
            var vertex0 = new THREE.Vector3();
            var vertex1 = new THREE.Vector3();
            vertex0.x = point[0];
            vertex0.y = point[1];
            vertex0.z = point[2];
            vertex1.x = point[3];
            vertex1.y = point[4];
            vertex1.z = point[5];


            _this.annotationContainer[cId].part.localToWorld(vertex0);
            _this.annotationContainer[cId].part.localToWorld(vertex1);

            const vector = new THREE.Vector3(vertex1.x, vertex1.y, vertex1.z);
            const vector0 = new THREE.Vector3(vertex0.x, vertex0.y, vertex0.z);
            const canvas = this.renderer.domElement;
            //console.log(completeViewer.re)

            vector0.project(this.camera);
            vector.project(this.camera);

            var rightSide = false;
            if (vector0.x < vector.x) {
                rightSide = true;
            }
            vector.x = Math.round((0.1 + vector.x / 2) * (canvas.width));           // window.devicePixelRatio
            vector.y = Math.round((0.1 - vector.y / 2) * (canvas.height));             // window.devicePixelRatio

            var annotation = _this.annotationContainer[cId].annotations[0].domElement;
            annotation.style.top = this.annotationTop;
            annotation.style.left = this.annotationLeft;

            if (rightSide) {
                annotation.style.right = "";
                annotation.style.left = this.annotationLeft;
            } else {
                annotation.style.right = "";
                annotation.style.left = (this.annotationLeft - this.annotation.offsetWidth) + 'px';

            }

        }
    }
    startAnnotation() {
        this.controls.enabled = false;
        this.renderer.domElement.addEventListener("mousedown", this.onMouseDownForAnnotation.bind(this), false);
        this.renderer.domElement.addEventListener("mousemove", this.onMouseMoveForAnnotation.bind(this), false);
        this.renderer.domElement.addEventListener("mouseup", this.onMouseUpForAnnotation.bind(this), false);

        this.annotation.referencePlane = this.addPlane()
        this.control = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.control);
        this.editMode = true;
        this.renderer.domElement.addEventListener("mousemove", this.highlightAnnotationDiv, false);

    }

    addPlane() {
        let sceneBb = new THREE.Box3().setFromObject(this.sceneObject)
        var lengthX = sceneBb.max.x - sceneBb.min.x;
        var lengthY = sceneBb.max.y - sceneBb.min.y;
        var lengthZ = sceneBb.max.z - sceneBb.min.z;
        var max = lengthX;
        if (lengthY > max) max = lengthY;
        if (lengthZ > max) max = lengthZ;
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(10 * max, 10 * max, 8, 8), new THREE.MeshBasicMaterial({ color: 0xb3e0ff, alphaTest: 0, visible: false }));
        plane.name = "AnnotationPlane";
        this.scene.add(plane);
        return plane;
    }

    onMouseDownForAnnotation(event) {
        this.controls.enabled = false;

        var _this = this.annotation;
        if (event.button === 0 && !_this.editAnnotationPos) {

            this.removeDOMElementsById(["annotation-context-div"]);

            var intersects = this.getIntersectedObject(event, this.sceneObject);

            if (intersects.length > 0 && intersects[0].object.type !== "Sprite") {

                _this.annotationPart = _this.getChildObjRespectToRoot(intersects[0].object);

                if (_this.annotationPart) {

                    this.controls.enabled = false;

                    var startPoint = intersects[0].point.clone();
                    var material = new THREE.LineBasicMaterial({ color: "#000000" });
                    const points = [];
                    points.push(startPoint);
                    points.push(startPoint);
                    _this.annotationPart.worldToLocal(startPoint);
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    _this.annotationLine = new THREE.Line(geometry, material);
                    _this.annotationLine.name = "DefaultAnnotationLine";
                    _this.annotationPart.add(_this.annotationLine);
                    var planeIntersects = this.raycaster.intersectObject(this.annotation.referencePlane);

                    if (planeIntersects.length > 0 && planeIntersects[0].point) {
                        _this.offset.copy(planeIntersects[0].point);
                        _this.offset.sub(this.annotation.referencePlane.position);
                        _this.annotationPointSelected = true;
                    }
                }


                //}
            }
        }
    }

    onMouseMoveForAnnotation(event) {
        this.controls.enabled = false;
        var _this = this.annotation;

        if (this.control.dragging) {
            var local = new THREE.Vector3();
            var spherePosition = _this.control.object.position.clone();
            _this.currentLineGeometry.worldToLocal(spherePosition);
            local.copy(spherePosition);
            _this.currentLineGeometry.geometry.attributes.position.array[3] = local.x;
            _this.currentLineGeometry.geometry.attributes.position.array[4] = local.y;
            _this.currentLineGeometry.geometry.attributes.position.array[5] = local.z;
            _this.currentLineGeometry.geometry.attributes.position.needsUpdate = true;
        }

        if (!_this.editAnnotationPos) {
            event.preventDefault();

            var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            var vector = new THREE.Vector3(mouseX, mouseY, 1);

            vector.unproject(this.camera);
            this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());

            if (_this.annotationPointSelected) {
                var intersects = this.raycaster.intersectObject(this.annotation.referencePlane);
                var vectorp = new THREE.Vector3();

                if (intersects[0] && intersects[0].point) {
                    vectorp.copy(_this.annotationPart.worldToLocal(intersects[0].point.sub(_this.offset)));
                }
                _this.annotationLine.geometry.getAttribute('position').array[3] = vectorp.x;
                _this.annotationLine.geometry.getAttribute('position').array[4] = vectorp.y;
                _this.annotationLine.geometry.getAttribute('position').array[5] = vectorp.z;
                _this.annotationLine.geometry.attributes.position.needsUpdate = true;
            } else {

                var intersects = this.raycaster.intersectObjects(this.sceneObject.children, true);

                if (intersects.length > 0) {
                    this.annotation.referencePlane.position.copy(intersects[0].point);
                    this.annotation.referencePlane.lookAt(this.camera.position);
                }
            }
        }
    }

    onMouseUpForAnnotation(event) {
        var _this = this.annotation;
        if (!_this.editAnnotationPos) {
            this.controls.enabled = true;
            if (_this.annotationPointSelected) {
                if (_this.add3DAnnotation === true) {
                    _this.add3dInputsUI(_this.addAnnotationElement);
                } else {
                    let intersects = this.raycaster.intersectObject(this.annotation.referencePlane);
                    if (intersects[0] != undefined) {
                        this.addInputsUI(event);
                    }
                }
            }
            _this.annotationPointSelected = false;
        }
    }

    addFinishBtn() {

        var partWindow = document.createElement("div");
        partWindow.id = "EditingAnnotation";
        partWindow.classList.add("finishOut");
        var studio_conatiner_id = document.getElementById("studio-container");
        studio_conatiner_id.style = "pointer-events: none; opacity : 0.5;";           //Disable studio container
        studio_conatiner_id.style.display = "block";
        var img_conatiner_id = document.getElementById("explode-icon")
        img_conatiner_id.style = "pointer-events: none; "


        var header = document.createElement("div");
        header.id = "partname";
        header.innerText = "Finish Annotation";
        header.classList.add("finishIn");
        header.onmouseenter = function () {
            if (this.dragElement) {
            }
        };
        header.onmousedown = function ()          //After clicking finish
        {
            this.controls.enabled = true;
            if (this.annotation.editMode) {
                this.annotation.stopAnnotation();
            }

            if (this.annotation.editMode3D) {
                this.annotation.stop3DAnnotation();
            }
            this.materialProperties.removeHighlights();
            this.removeDOMElementsById(["annotationcontextmenudiv", "EditingAnnotation"])

            var studio_conatiner_id = document.getElementById("studio-container");
            studio_conatiner_id.style = "pointer-events: all;";           //Disable studio container

            var img_conatiner_id = document.getElementById("explode-icon")
            img_conatiner_id.style = "pointer-events: all; "
            studio_conatiner_id.style.display = "block";
        };
        partWindow.appendChild(header);
        var body = document.getElementsByTagName('body')[0];
        body.insertBefore(partWindow, body.children[0]);

    }

}


export { completeViewer, create }
