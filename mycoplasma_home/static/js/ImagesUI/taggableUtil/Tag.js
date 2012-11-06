function Tag(colorArr, tagPoints, description, imageKey, siteUrl) {
	this.color = colorArr;
	this.points = tagPoints;
	this.description = description;
	this.imageKey = imageKey;
	this.saveUrl = siteUrl + 'administration/saveTag';
	this.geneLinks = [];
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
Tag.prototype.save = function(callback) {
	var savingDialog = new TagSavingDialog();
	savingDialog.start();
	
	$.ajax({
		url : this.saveUrl,
		type : 'POST',
		data : {
			color : this.color,
			points : this.points,
			description : this.description,
			geneLinks : this.geneLinks
		},
		dataType : 'json',
		success : function(data, textStatus, jqXHR) {
			if (!data.error) {
				savingDialog.success();
				callback();
			}
			else {
				savingDialog.error();
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
			savingDialog.error();
		}
	});
};

function TagSavingDialog() {
	this.dialog = $('<div />', {
		'class' : 'tag-saving-dialog',
	});
	
	this.block = $('<div />');
	
	this.contents = $('<div />', {
		'class' : 'tag-saving-contents'
	});
	
	this.dialog.append(this.contents);
};

TagSavingDialog.prototype.start = function() {
	this.block.addClass('page-block');
	this.block.height($(window).height());
	this.block.width($(window).width());
	
	var block = this.block;
	
	$(window).resize(function() {
		block.height($(this).height());
		block.width($(this).width());
	});
	
	$('body').append(this.block);
	$('body').append(this.dialog);
};

TagSavingDialog.prototype.success = function() {
	alert("Success");
};

TagSavingDialog.prototype.error = function() {
	alert("Error");
};