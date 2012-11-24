function NewGeneLinkDialog(pageBlock, organisms, this.siteUrl) {
	this.block = pageBlock;
	this.submitUrl = this.siteUrl + 'administration/addNewGeneLink';
	
	this.dialog = $('<div />', {
		'class' : 'tagging-dialog',
	});
	
	this.block = pageBlock;
	
	this.title = $('<div />', {
		'class' : 'tagging-dialog-title',
		'text' : 'Add New Gene Link'
	});
	
	this.closeButton = $('<span />', {
		'class' : 'ui-icon ui-icon-circle-close close-button'
	});
	
	this.title.append(this.closeButton);
	
	this.contents = $('<div />', {
		'class' : 'tagging-dialog-contents'
	});
	
	this.geneName = $('<input />', {
		'type' : 'text'
	});
	
	var nameLabel = $('<span />', {
		'text' : 'Gene or Locus Tag',
		'style' : 'margin-right: 10px'
	});
	
	this.contents.append(nameLabel);
	this.contents.append(this.name);
	
	this.organism = $('<select />', {
		'type' : 'text'
	});
	
	var self = this;
	
	$.each(organisms, function(index, organism) {
		var option = $('<option />', {
			'text' : organism.common_name,
			'value' : organism.organism_id
		});
		self.append(option);
	});
	
	var organismLabel = $('<span />', {
		'text' : 'Organism',
		'style' : 'margin-right: 10px'
	});
	
	this.contents.append(organismLabel);
	this.contents.append(this.organism);
	
	this.finalizeUI = $('<div />', {
		'class' : 'tagging-dialog-contents'
	});
	
	this.finalizeBody = $('<div />');
	
	this.submitGeneLinkButton = $('<button />', {
		'class' : 'tagging-menu-button',
		'text': 'Add'
	});
	
	this.cancelButton = $('<button />', {
		'class' : 'tagging-menu-button',
		'text': 'Cancel',
		'style' : 'margin-left: 10px'
	});
	
	this.finalizeBody.append(this.submitGeneLinkButton);
	this.finalizeBody.append(this.cancelButton);
	this.finalizeBody.css('border-top', '1px solid #CCC');
	this.finalizeBody.css('padding-top', '5px');
	
	this.finalizeUI.append(this.finalizeBody);
	
	
	this.dialog.append(this.title);
	this.dialog.append(this.contents);
	this.dialog.append(this.finalizeUI);
	
	this.submitCallback = null;
	
	this.submitTagGroupButton.on('click', Util.scopeCallback(this, this.onSubmit));
	this.cancelButton.on('click', Util.scopeCallback(this, this.onCancel));
	this.closeButton.on('click', Util.scopeCallback(this, this.onCancel));
	
	$('body').append(this.dialog);
};

NewGeneLinkDialog.prototype.onSubmit = function() {
	var geneName = $.trim(this.geneName.val());
	var organismId = this.organism.val();
	var tagIds = [];
	if (geneName && organism && this.selectedTags) {
		for (var i = 0; i < this.selectedTags.length; i++) {
			tagIds.push(this.selectedTags[i].getId());
		}
		
		var self = this;
		
		$.ajax({
			url : this.submitUrl,
			type : 'POST',
			data : {
				geneName : geneName,
				organismId : organismId,
				tagKeys: tagIds
			},
			dataType : 'json',
			success : function(data, textStatus, jqXHR) {
				if (!data.error) {
					for (var i = 0; i < self.selectedTags.length; i++) {
						self.selectedTags[i].addNewGeneLink(data.feature);
					}
				}
				else {
					alert(data.errorMessage);
				}
			},
			error : function(jqXHR, textStatus, errorThrown) {
				alert(errorThrown);
			}
		});
		
	}
};

NewGeneLinkDialog.prototype.onCancel = function() {
	this.hide();
};

NewGeneLinkDialog.prototype.hide = function() {
	this.block.hide();
	this.dialog.hide();
};

NewGeneLinkDialog.prototype.show = function(selectedTags) {
	this.selectedTags = selectedTags;
	this.block.show();
	this.dialog.show();
};