# Move Canvas and its Content
Although the Bluescape UI creates the impression that a Canvas is a container that holds other elements, that isn't actually the case. Programmatically moving a Canvas will leave any "contained" elements where they were in the overall Workspace unless they are also moved.

This app demonstrates how to find an available area within the workspace to move a Canvas to, and then how to move the Canvas along with the elements that appear within its borders.

## Details
All operations will be performed using the Bluescape GraphQL API. Moving an element is done using a Mutation specific to the element type. In most cases, for the purposes of moving an element, the only difference is the Mutation name, but there are two types of elements that require special handling via element-specific functions:

- Lines: If either end of a line is attached to an object, then it will be automatically moved with the object. However, lines that are unattached to an object at one or both ends must have those ends specifically moved.
- Brush Strokes: Unlike all other element types, brush strokes within a Canvas are moved via relative positioning, instead of absolute. Also, there is a known issue that means a brush stroke can only be moved successfully once. If it gets moved a second time, it will act as if it was starting from the point it existed at prior to the first time it was moved. This should be resolved by an upcoming change to the Brush Strokes feature.

Note also, that for an element to be moved along with the Canvas, the element must be **entirely** contained within the Canvas. If any part of the element falls outside of the Canvas borders then it will not be moved.

## Contact us

If you have any questions or comments, please contact us in our [Bluescape Community site](https://community.bluescape.com/c/developer/14).