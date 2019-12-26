# Robot Path Planning

This project illustrates throughout some examples and interactive applications the 
robot path planning using the shortest path from one point to another avoiding
collision with objects. 

It uses the divide and conquer technique to split the problem into subproblems: 
Minkowski Sums for simple polygons, Union of polygons, construction of the 
Visibility Graph and a sample application that resumes all this concepts.

This project was developed using plain javascript together with the 
PIXI.js library to design the interaction samples. 

This application was deployed [here](https://minkowski-sum.herokuapp.com/minkownski-sum.html).

To run this application locally install type:

```
npm install
node index.js
```

Then open your browser and type:

```
http://localhost:3000/index.html
```
