function Tag(id, colorArr, tagPoints, description, imageKey, siteUrl, tagGroup) {
	this.id = id;
	this.color = colorArr;
	this.tagGroup = tagGroup;
	this.points = tagPoints;
	this.description = description;
	this.imageKey = imageKey;
	this.siteUrl = siteUrl;
	this.saveUrl = siteUrl + 'administration/saveTag';
	this.geneLinks = [];
};

Tag.prototype.setTagGroup = function(tagGroup) {
	this.tagGroup = tagGroup;
};

Tag.prototype.setId = function(id) {
	this.id = id;
};

Tag.prototype.getId = function() {
	return this.id;
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

Tag.prototype.getGeneLinks = function() {
	return this.geneLinks;
};

Tag.prototype.getFormattedColor = function() {
	if (this.color[0] + this.color[1] + this.color[2] != 0) {
		return 'rgba(' + this.color.join() + ',0.5)';
	}
	else {
		return '';
	}
};

/**
 * Saves this tag into the database using an ajax call
 * 
 * @param callback: function to run when the saving of the tag has been confirmed.
 */
Tag.prototype.save = function(callback, errorCallback, tagGroupKeys) {
	$.ajax({
		url : this.saveUrl,
		type : 'POST',
		data : {
			color : this.color,
			points : this.points,
			description : this.description,
			tagGroupKeys : tagGroupKeys
		},
		dataType : 'json',
		success : function(data, textStatus, jqXHR) {
			if (!data.error) {
				callback(data.tagKeys);
			}
			else {
				errorCallback(data.errorMessage);
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
			errorCallback(textStatus);
		}
	});
};

Tag.prototype.copy = function() {
	return new Tag(this.getColor(), this.getPoints(), this.description, this.imageKey, this.siteUrl);
};