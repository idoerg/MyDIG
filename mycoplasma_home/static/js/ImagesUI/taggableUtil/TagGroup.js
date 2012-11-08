/**
 * Object that represents a grouping of image tags
 * 
 * @param group
 * @param imageKey
 * @param siteUrl
 * @return
 */
function TagGroup(group, imageKey, siteUrl) {
	this.tags = [];
	this.lastModified = TaggableUtil.toDate(group.lastModified);
	this.dateCreated = TaggableUtil.toDate(group.dateCreated);
	this.name = group.name;
	this.key = group.pk;
	
	for (var i = 0; i < group.tags.length; i++) {
		var tag = group.tags[i];
		var colorArr = tag.color;
		var tagPoints = tag.points;
		var description = tag.description;
		this.tags.push(new Tag(colorArr, tagPoints, description, imageKey, siteUrl));
	}
};

TagGroup.prototype.getTags = function() {
	return this.tags;
};