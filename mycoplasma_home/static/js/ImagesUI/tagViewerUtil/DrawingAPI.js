/**
 * Creates an API for drawing on the drawing board and then saving the tag onto
 * 
 * 
 * @param drawingBoard
 * @param tagBoard
 * @return
 */
function DrawingAPI(tagBoard, siteUrl, originalData, image, imageMetadata, genomicInfo) {
	this.tagBoard = new TagBoard(tagBoard, originalData, image, imageMetadata, genomicInfo, siteUrl);
	this.imageMetadata = imageMetadata;
	this.image = image;
};