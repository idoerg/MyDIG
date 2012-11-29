function HelpDialog(pageBlock, pageTitle, contents) {
	this.block = pageBlock;
	this.dialog = $('<div />', {
		'class' : 'dialog',
	});
	
	this.block = pageBlock;
	
	this.title = $('<div />', {
		'class' : 'dialog-title',
		'text' : 'Help for ' + pageTitle
	});
	
	this.closeButton = $('<span />', {
		'class' : 'ui-icon ui-icon-circle-close close-button'
	});
	
	this.title.append(this.closeButton);
	
	this.contents = $('<div />', {
		'class' : 'dialog-contents'
	});

	this.contents.append(contents);
	
	this.finalizeUI = $('<div />', {
		'class' : 'dialog-contents'
	});
	
	this.finalizeBody = $('<div />');
	
	this.cancelButton = $('<button />', {
		'class' : 'dialog-menu-button',
		'text': 'Close',
		'style' : 'margin-left: 10px'
	});
	
	this.finalizeBody.append(this.cancelButton);
	this.finalizeBody.css('border-top', '1px solid #CCC');
	this.finalizeBody.css('padding-top', '5px');
	
	this.finalizeUI.append(this.finalizeBody);
	
	this.dialog.append(this.title);
	this.dialog.append(this.contents);
	this.dialog.append(this.finalizeUI);
	
	this.submitCallback = null;
	this.cancelButton.on('click', Util.scopeCallback(this, this.onCancel));
	this.closeButton.on('click', Util.scopeCallback(this, this.onCancel));
	
	$('body').append(this.dialog);
};

HelpDialog.prototype.onCancel = function() {
	this.hide();
};

HelpDialog.prototype.hide = function() {
	this.block.hide();
	this.dialog.hide();
};

HelpDialog.prototype.show = function() {
	this.block.show();
	this.dialog.show();
};