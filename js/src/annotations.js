import * as THREE from 'three'
import { completeViewer, create } from './viewer.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js'


var annotObject = {};

class Annotation  {
    constructor() {

        this.editMode = false;
        this.editMode3D = false;
        this.control = null;
        this.display = false;
        this.displayAll = false;
        this.currentSelected = null;
        this.offset = new THREE.Vector3();
        this.referencePlane = null;
        this.annotationPointSelected = false;
        this.annotationLine = null;
        this.annotationPart = null;
        this.annotationContainer = {};
        this.editAnnotationPos = false;
        this.defaultAnnotation = false;
        this.topLeftParts = [];
        this.topRightParts = [];
        this.bottomRightParts = [];
        this.bottomLeftParts = [];
        this.highlightedDomElement = null;
        this.drag = false;
        annotObject = this;
        this.annotationEditMode = false;
        this.annotationEditModeChecked = false;
        this.add3DAnnotation = false;
        this.hotspotScaleValue = 1;
        this.hotspot = null;
        this.selectedSprite = null;
        this.currentLineGeometry = null;
        this.dummySphere = null;
      
    }

    removeAnnotation() {
        var newAnnotationFactory = {}

        for (let id in this.annotationContainer) {
            if (completeViewer.sceneObject.children[0].getObjectByProperty("uuid", this.annotationContainer[id].part.uuid)) {

                this.annotationContainer[id].part.userData.annotationNo = 0;

                const annotations = this.annotationContainer[id].annotations;

                for (let i = 0; i < annotations.length; i++) {
                    if (annotations[i].line.parent) {
                        annotations[i].line.parent.remove(annotations[i].line);
                    }

                    if (annotations[i].domElement.parentElement) {
                        annotations[i].domElement.parentElement.removeChild(annotations[i].domElement);
                    }
                }
            } else {
                newAnnotationFactory[id] = this.annotationContainer[id]
            }
        }

        completeViewer.sceneObject.children[0].traverse(function (child) {
            if (child.userData.defaultAnnotation === true) {
                child.userData.defaultAnnotation = false;
            }
        })

        this.annotationContainer = newAnnotationFactory

        this.topLeftParts = [];
        this.topRightParts = [];
        this.bottomRightParts = [];
        this.bottomLeftParts = [];

        completeViewer.sceneObject.userData.hasAnnotation = false;

        this.display = false;
        this.defaultAnnotation = false

        completeViewer.renderer.domElement.removeEventListener("mousemove", this.highlightAnnotationDiv, false);
    }

    removeAnnotationElement(event) {
        var _this = this.annotation;
        let arr = event.currentTarget.id.split('.');

        if (_this.annotationContainer.hasOwnProperty([arr[0]]) && _this.editMode) {
            _this.annotationContainer[arr[0]].part.userData.annotationNo--;

            _this.annotationContainer[arr[0]].annotations[arr[1]].line.parent.remove(_this.annotationContainer[arr[0]].annotations[arr[1]].line);

            _this.annotationContainer[arr[0]].annotations[arr[1]].domElement.parentElement.removeChild(_this.annotationContainer[arr[0]].annotations[arr[1]].domElement);

            _this.annotationContainer[arr[0]].annotations.splice(arr[1], 1);

            //rename according to re-arrange
            if (_this.annotationContainer[arr[0]].annotations.length > 0) {
                for (var i = arr[1]; i < _this.annotationContainer[arr[0]].annotations.length; i++) {
                    _this.annotationContainer[arr[0]].annotations[i].domElement.id = arr[0] + "." + i;
                }
            } else {
                delete _this.annotationContainer[arr[0]];
            }

            this.materialProperties.removeHighlights();
        }
    }

    startAnnotation() {
        this.closeOtherFeatures();
        completeViewer.renderer.domElement.addEventListener("mousedown", this.onMouseDownForAnnotation, false);
        completeViewer.renderer.domElement.addEventListener("mousemove", this.onMouseMoveForAnnotation, false);
        completeViewer.renderer.domElement.addEventListener("mouseup", this.onMouseUpForAnnotation, false);
        completeViewer.renderer.domElement.addEventListener("contextmenu", this.onContextMenu, false);

        this.referencePlane = this.addPlane()
        this.control = new TransformControls(completeViewer.camera, completeViewer.renderer.domElement);
        completeViewer.scene.add(this.control);
        this.editMode = true;
        this.showAnnotations(true);
        this.changeExplosionEndTextColor("rgb(0, 255, 204)");


        completeViewer.renderer.domElement.addEventListener("mousemove", this.highlightAnnotationDiv, false);

        this.addFinishBtn();

    }

    stopAnnotation() {
        completeViewer.renderer.domElement.removeEventListener("mousedown", this.onMouseDownForAnnotation, false);
        completeViewer.renderer.domElement.removeEventListener("mousemove", this.onMouseMoveForAnnotation, false);
        completeViewer.renderer.domElement.removeEventListener("mouseup", this.onMouseUpForAnnotation, false);
        completeViewer.renderer.domElement.removeEventListener("contextmenu", this.onContextMenu, false);
        completeViewer.renderer.domElement.removeEventListener("contextmenu", this.onContextMenu3D, false);


        completeViewer.scene.remove(this.referencePlane);

        this.control.dispose();
        completeViewer.scene.remove(this.control);
        this.currentLineGeometry = null;
        if (this.dummySphere) {
            this.dummySphere.geometry.dispose();
            this.dummySphere.material.dispose();
            completeViewer.scene.remove(this.dummySphere);
        }
        this.editAnnotationPos = false;
        this.dummySphere = null;
        this.control = null;
        this.referencePlane = null;
        this.editMode = false;
        this.display = false;
        this.add3DAnnotation = false;

        this.changeExplosionEndTextColor("rgb(255, 255, 255)");
        this.showAnnotations(false);

        this.removeDOMElementsById(["annotation-context-div", "annotationcontextmenudiv"]);
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
        // header.setAttribute("partname", partName);
        header.classList.add("finishIn");
        header.onmouseenter = function () {
            if (this.dragElement) {
            }
        };
        header.onmousedown = function ()          //After clicking finish
        {
            completeViewer.controls.enabled = true;
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
        //partWindow.appendChild(materialsDiv);
        var body = document.getElementsByTagName('body')[0];
        body.insertBefore(partWindow, body.children[0]);

    }
   
    toggleAnnotations(state) {

        this.display = typeof state === "boolean" ? state : !this.display;

        if (this.display === true) {
            this.showAnnotation(completeViewer.sceneObject.children[0]);
            completeViewer.renderer.domElement.addEventListener("mousemove", this.highlightAnnotationDiv, false);
        } else {
            this.hideAnnotation(completeViewer.sceneObject.children[0]);
            completeViewer.renderer.domElement.removeEventListener("mousemove", this.highlightAnnotationDiv, false);
        }
    }

    showAnnotations(state) {
        if (state === true) {
            this.showAnnotation(completeViewer.sceneObject.children[0]);
        } else {
            this.hideAnnotation(completeViewer.sceneObject.children[0]);
        }



        if (state) {
            completeViewer.renderer.domElement.addEventListener("mousemove", this.highlightAnnotationDiv, false);
        } else {
            completeViewer.renderer.domElement.removeEventListener("mousemove", this.highlightAnnotationDiv, false);
        }
    }

    showAnnotation(object) {

        var _this = this;
        object.traverse(function (child) {
            if (child.type === "Object3D") {
                _this.showAnnotationFromContainer(child);
                if (!(child.userData.childType === "Part") && _this.displayAll === true) {
                    _this.showAnnotationFromContainer(child);
                }
            }

        })
    }


    hideAnnotation(object) {
        var _this = this;
        object.traverse(function (child) {
            if (child.type === "Object3D") {
                _this.hideAnnotationFromContainer(child);
                if (!(child.userData.childType === "Part") && _this.displayAll === true) {
                    _this.hideAnnotationFromContainer(child);
                }
            }

        })

    }

    showAnnotationFromContainer(child) {
        var _this = this;
        if (_this.annotationContainer[child.userData.compId]) {
            let annotations = _this.annotationContainer[child.userData.compId].annotations
            for (let i = 0; i < annotations.length; i++) {
                if (!child.children.includes(annotations[i].line)) {
                    child.add(annotations[i].line);
                }
                annotations[i].line.visible = true;
                if (!annotations[i].domElement.parentElement) {
                    document.body.appendChild(annotations[i].domElement);
                }

                annotations[i].domElement.style.display = "block";
            }
        }
    }

    hideAnnotationFromContainer(child) {
        var _this = this;
        if (_this.annotationContainer[child.userData.compId]) {
            let annotations = _this.annotationContainer[child.userData.compId].annotations

            for (let i = 0; i < annotations.length; i++) {

                if (annotations[i].line.parent != null) {
                    let parent = annotations[i].line.parent

                    parent.remove(annotations[i].line);
                }

                if (!annotations[i].domElement.parentElement) {
                    document.body.appendChild(annotations[i].domElement);
                }

                annotations[i].domElement.style.display = "none";
            }
        }
    }

    getChildObjRespectToRoot(object) {
        if (object) {
          return object;  
        }
    }


    getAnnotationDiv(id, aText, hyperlink, imgURL, imageW = "100", imageH = "100") {
        var annotation = document.createElement("div");

        annotation.id = id

        if (hyperlink) {
            var anchor = document.createElement("a");
            if (hyperlink.slice(0, 6) == "https:")
            anchor.href = hyperlink;
        else if (hyperlink.slice(0, 5) == "http:") {
            anchor.href = 'https:' + hyperlink.slice(5);
        } else {
            anchor.href = 'https://' + hyperlink;
        }
            anchor.href = hyperlink;
            anchor.target = "_blank";
            anchor.style.color = "rgb(255, 255, 255)";
        }

        if (imgURL) {
            var imgDiv = document.createElement("div");
            var img = document.createElement("img");
            img.src = imgURL;

            img.style.height = imageH + "px";
            img.style.width = imageW + "px";
            imgDiv.appendChild(img);
        }

        if (aText) {
            var span = document.createElement("span");
            span.style = "-moz-user-select: none; -webkit-user-select: none; -ms-user-select:none; user-select:none;-o-user-select:none;"
            span.unselectable = "on"
            span.onselectstart = "return false;"
            span.onmousedown = "return false;"
            span.innerText = aText;
        }

        //case:1-6
        if (aText && !imgURL && !hyperlink) {
            annotation.appendChild(span);
        }
        else if (aText && !imgURL && hyperlink) {
            anchor.appendChild(span);
            annotation.appendChild(anchor);
        }
        else if (!aText && imgURL && !hyperlink) {
            annotation.appendChild(imgDiv);
        }
        else if (!aText && imgURL !== '' && hyperlink) {
            anchor.appendChild(imgDiv);
            annotation.appendChild(anchor);
        }
        else if (aText && imgURL && !hyperlink) {

            annotation.appendChild(imgDiv);
            annotation.appendChild(span);

        }
        else if (aText && imgURL && hyperlink) {
            anchor.appendChild(span);
            annotation.appendChild(imgDiv);
            annotation.appendChild(anchor);
        }
        annotation.onmouseenter = function () {
            if (this.hasOwnProperty('materialProperties'))
                this.materialProperties.highlightPartUsingCompId(Number(id.split('.')[0]));
            this.annotation.currentSelected = annotation;
            annotation.style.backgroundColor = "rgb(0, 102, 255)"
        };

        annotation.onmouseup = function () { // responsible to crerate inputsUI 
            if (this.hasOwnProperty('materialProperties')) {
                var _this = this.annotation;
                if (!_this.editAnnotationPos) {
                    completeViewer.controls.enabled = true;
                    if (_this.annotationPointSelected) {
                        if (_this.add3DAnnotation === true) {
                            _this.add3dInputsUI(_this.addAnnotationElement);

                        } else {
                            let intersects = completeViewer.raycaster.intersectObject(_this.referencePlane);
                            if (intersects[0] != undefined) {
                                _this.addInputsUI();

                            }
                        }
                    }
                    _this.annotationPointSelected = false;
                }
            }
        };

        annotation.onmouseleave = function () {
            if (completeViewer.hasOwnProperty('materialProperties'))
            completeViewer.materialProperties.removeHighlights();

            annotation.style.backgroundColor = "rgb(0, 0, 0)"
        };

        document.addEventListener('mouseup', function () {
            if (completeViewer.annotation.currentSelected !== undefined) {
                if (completeViewer.annotation.currentSelected !== null)
                completeViewer.annotation.currentSelected = null;
            }
        }, false);

        annotation.addEventListener("mouseenter", function (e) {
            completeViewer.controls.enabled = false;
            if (completeViewer.annotation.editMode === true && completeViewer.annotation.annotationEditMode === true) {
                annotObject.dragElement(annotation, function (event) {
                    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
                    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
                    var vector = new THREE.Vector3(mouseX, mouseY, 1);
                    vector.unproject(completeViewer.camera);
                    completeViewer.raycaster.set(completeViewer.camera.position, vector.sub(completeViewer.camera.position).normalize());
                    if (annotObject.referencePlane) {
                        var intersects = completeViewer.raycaster.intersectObject(annotObject.referencePlane);
                        if (intersects[0]) {
                            annotObject.offset.copy(intersects[0].point);
                        }
                        annotObject.offset.sub(annotObject.referencePlane.position);
                        annotObject.drag = true
                    }
                }, function () {
                    annotObject.drag = false
                });
            }
        }, false);

        document.addEventListener("mousemove", function (event) {
            if (completeViewer.annotation && completeViewer.annotation.annotationEditMode && completeViewer.annotation.editMode === true) {
                if (completeViewer.annotation.currentSelected) {
                    let compid = completeViewer.annotation.currentSelected.id.split(".")[0];
                    let lineid = completeViewer.annotation.currentSelected.id.split(".")[1];
                    let object = completeViewer.getObjectByCompId(compid, completeViewer.sceneObject);
                    if (annotObject.drag) {
                        var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
                        var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
                        var vector = new THREE.Vector3(mouseX, mouseY, 1);
                        vector.unproject(completeViewer.camera);
                        completeViewer.raycaster.set(completeViewer.camera.position, vector.sub(completeViewer.camera.position).normalize());
                        var intersects = completeViewer.raycaster.intersectObject(annotObject.referencePlane);
                        var localPosition = new THREE.Vector3();
                        var worldPosition = new THREE.Vector3();
                        if (intersects[0]) {
                            worldPosition.copy(intersects[0].point.sub(annotObject.offset))
                        }

                        var annotLine = object.children[parseInt(lineid) + 1]
                        if (annotLine.type !== "Line") {
                            annotLine = object.children.find(function (element) { return element.type === "Line" })
                        }
                        localPosition.copy(object.worldToLocal(worldPosition));
                        annotLine.geometry.vertices[1].copy(localPosition);
                        annotLine.geometry.verticesNeedUpdate = true;
                    } else {
                        let worldVector = new THREE.Vector3();
                        let localVector = new THREE.Vector3();
                        var annotLine = object.children[parseInt(lineid) + 1]
                        if (annotLine.type !== "Line") {
                            annotLine = object.children.find(function (element) { return element.type === "Line" })
                        }
                        localVector.copy(annotLine.geometry.vertices[1])
                        worldVector.copy(object.localToWorld(localVector));
                        annotObject.referencePlane.position.copy(worldVector);
                        annotObject.referencePlane.lookAt(completeViewer.camera.position);

                    }
                }
            }
        });

        annotation.style = "position: absolute; text-align: center; background-color: rgb(0, 0, 0); padding: 7px; border: 1px solid rgb(212, 212, 212); overflow: hidden;  border-radius: 20px; color: rgb(255, 255, 255); box-shadow: 0px 0px 5px 1px white; min-width: 10px; min-height: 10px;";
        annotation.addEventListener("contextmenu", this.contextMenuForTextAnnotation, false);
        var container = document.getElementsByClassName("cds-cad-viewer-container")[0]
        if (container) container.appendChild(annotation);

        return annotation
    }


    appendAnnotation(id, part, annotation) {
        var annotationElement = this.getAnnotationDiv(id, annotation.data.text, annotation.data.url, annotation.data.imageUrl, annotation.data.imageWidth, annotation.data.imageHeight)

        completeViewer.sceneObject.userData.hasAnnotation = true;

        if (!this.annotationContainer.hasOwnProperty(part.userData.compId))
            this.annotationContainer[part.userData.compId] = { part: null, annotations: [] };

        this.annotationContainer[part.userData.compId].part = part;
        annotation.domElement = annotationElement
        this.annotationContainer[part.userData.compId].annotations.push(annotation);

        window.removeEventListener("click", this.undoAnnotation, false);
        window.removeEventListener("keydown", this.addAnnotationElement, false);

        var annotationDiv = document.getElementById("annotation-div");
        if (annotationDiv) {
            annotationDiv.parentElement.removeChild(annotationDiv);
        }
    }

    undoAnnotation(event) {
        var annotationDiv = document.getElementById("annotation-div");
        if (event.target === annotationDiv) {
            var _this = this.annotation;
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

    dispose() {
        //Delete annotation elements
        for (let compId in this.annotationContainer) {
            let annotations = this.annotationContainer[compId].annotations
            for (let i = 0; i < annotations.length; i++) {
                annotations[i].domElement.parentNode.removeChild(annotations[i].domElement);
            }
        }

        this.clearData();
        this.removeEventListeners();
    }

    clearData() {
        this.add3DAnnotation = false;
        this.annotationContainer = {};
        this.annotationEditMode = false;
        this.annotationEditModeChecked = false;
        this.annotationLine = null;
        this.annotationPart = null;
        this.annotationPointSelected = false;
        this.bottomLeftParts = [];
        this.bottomRightParts = [];
        this.control = null;
        this.defaultAnnotation = false;
        this.display = false;
        this.displayAll = false;
        this.drag = false;
        this.editAnnotationPos = false;
        this.editMode = false;
        this.editMode3D = false;
        this.highlightedDomElement = null;
        this.hotspot = null;
        this.hotspotScaleValue = null;
        this.offset = null;
        this.referencePlane = null;
        this.selectedSprite = null;
        this.topLeftParts = [];
        this.topRightParts = [];

    }

    removeEventListeners() {

        completeViewer.renderer.domElement.removeEventListener("mousemove", this.highlightAnnotationDiv, false);

    }

}

export { Annotation }