function Menu() {
	this.menuBar = $('<div />', {
		'class' : 'toolbar-container'
	});
	
	this.sections = {};
};

Menu.prototype.addNewSection = function(name, section) {
	this.sections[name] = section;
	this.menuBar.append(section.getUI());
};

Menu.prototype.getUI = function() {
	return this.menuBar;
};