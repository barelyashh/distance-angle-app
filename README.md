# distance-angle-assignment

# THREE.JS ASSIGNMENT

This assignment includes 
1. Reading a sample STL files provided (teeth.stl). 
 - File get loaded when you run the application/at the time of viewer creation.

2. Apply the rotation(Rotation on off on button click) ;
   - I have provided a button rotate which will rotate the model in x axis.
   - clicking on the button again will stop the rotation and bring the model to its original state.

3. Add Line measurement on the model .
- I have provided a button "Distance" which will enable user to select two points over the model.
- Everytime you click on the model if the raycaster hits the object a sphere geometry will get created.
- These sphere geometry will be points and a line will get created between those points.
- The distance between the points will be shown at the left top corner.


4. Add Angle measurement on the model.
I have provided a button "Angle" which will enable user to select two points over the model.
- Everytime you click on the model if the raycaster hits the object a sphere geometry will get created.
- These sphere geometry will be points and a line will get created between those points.
- The Angle will be shown at the left top corner.


5. Create the text annotation on the model, User can click on the model and show a small text box in the same position where the user can add the text(Optional)
-  I have provided a button "Annotation" which will enable user to create 2D annotations.
- When the button is clicked user can select the part for which the user wants to create annotations.
- Drag the line to the position where you want the annotation label to be shown.
- A text box will appear which will help you give the label for the annotation of your choice.
- After naming the label and clicking enter the annotation will be shown - a small text box in the same position.


Issues: 
Regarding the functionalities related to annotations, there are a couple of issues but those can be resolved within a few extra hours..
Creating annotations seems to require around 6 to 7 clicks.  
Additionally, there appears to be an inconsistency in the rotation of the model.


Additional feature- 
-Disposing on annotations when user switch to a different functionality by clicking on the buttons.
  -Example:  Rotate/Distance/Angle.


## Steps to run the Application

Since Its a node based application setup I have removed the node_modules folder from the package.
- extract the package and open it in VS code.
- Go to terminal and run the command  - npm i
- It will add the neccessary packages to required by the application such as three.JS
- click on live server button and you will be able to see the running application on the browser.

