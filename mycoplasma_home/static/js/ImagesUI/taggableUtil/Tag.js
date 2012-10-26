function Tag(colorArr, tagPoints, description) {
	this.color = colorArr;
	this.points = tagPoints;
	this.description = description;
};

Tag.prototype.getColor = function() {
	return this.color;
};

Tag.prototype.getPoints = function() {
	return this.points;
};

Tag.prototype.getDescription = function() {
	return this.description;
};

Tag.prototype.getFormattedColor = function() {
	if (this.color[0] + this.color[1] + this.color[2] != 0) {
		return 'rgba(' + this.color.join() + ',0.5)';
	}
	else {
		return '';
	}
};