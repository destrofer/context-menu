/*
* ContextMenu
*
* Copyright (c) 2016 Viacheslav Soroka
*
* MIT License - http://www.opensource.org/licenses/mit-license.php
*/
var ContextMenu = function(options) {
	this.options = $.extend({
		onDataChange: null, // function(previousData) called when data was changed by calling setData() method
		onClick: null, // function(item, event) called when an item is clicked in context menu
		onCancel: null, // function() called only when context menu is closed without clicking on any menu item
		onShow: null, // function() always called when context menu is opened
		onHide: null, // function() always called when context menu is closed
		onOver: null, // function(item) always called when mouse moves over an item
		onOut: null, // function(item) always called when mouse moves out from an item

		data: null,
		width: null
	}, (typeof options == 'object') ? options : {});

	this.data = this.options.data;
	this.width = this.options.width;
	this.items = [];
};

ContextMenu.activeMenu = null;
ContextMenu.ignoreGlobalClick = false;

ContextMenu.prototype.options = null;
ContextMenu.prototype.data = null;
ContextMenu.prototype.items = null;
ContextMenu.prototype.$element = null;
ContextMenu.prototype.x = 0;
ContextMenu.prototype.y = 0;
ContextMenu.prototype.width = null;

ContextMenu.prototype.setOptions = function(options) {
	this.options = $.extend(this.options, options);
	if( this.width !== this.options.width )
		this.setWidth(this.options.width);
	if( this.data !== this.options.data )
		this.setData(this.options.data);
	return this;
};

ContextMenu.prototype.setData = function(data) {
	var previousData = this.data;
	this.data = data;
	if( typeof this.options.onDataChange == 'function' )
		this.options.onDataChange.call(this, previousData);
	return this;
};

ContextMenu.prototype.setWidth = function(width) {
	this.width = width;
	this.updateView();
	return this;
};

ContextMenu.prototype.addItem = function(item) {
	this.items.push(item);
	this.updateView();
	return this;
};

ContextMenu.prototype.hide = function(noCancel) {
	if( !this.$element )
		return this;

	this.$element.remove();
	this.$element = null;
	ContextMenu.activeMenu = null;

	if( (typeof noCancel != 'boolean' || !noCancel) && typeof this.options.onCancel == 'function' )
		this.options.onCancel.call(this);

	if( typeof this.options.onHide == 'function' )
		this.options.onHide.call(this);
	return this;
};

ContextMenu.prototype.show = function(x, y) {
	if( ContextMenu.activeMenu )
		ContextMenu.activeMenu.hide();
	ContextMenu.activeMenu = this;

	this.x = x;
	this.y = y;

	this.$element = $('<div class="context-menu" />');
	this.$element
		.data('contextMenu', this)
		.css({
			position: 'fixed',
			left: x + 'px',
			top: y + 'px'
		})
		.on('click', ContextMenu.onMenuClick)
		.on('mouseover', '.context-menu-item', ContextMenu.onItemOver)
		.on('mouseout', '.context-menu-item', ContextMenu.onItemOut);

	$('body').append(this.$element);
	this.updateView();
	ContextMenu.ignoreGlobalClick = true;
	setTimeout(function() {
		ContextMenu.ignoreGlobalClick = false;
	}, 1);

	if( typeof this.options.onShow == 'function' )
		this.options.onShow.call(this);
	return this;
};

ContextMenu.prototype.updateView = function() {
	if( !this.$element )
		return this;

	this.$element.html('');
	for( var i = 0, il = this.items.length; i < il; i++ ) {
		var item = this.items[i];
		var $item = $('<div class="context-menu-item" />');
		$item.data('cmItem', item);
		if( item.hasOwnProperty('html') )
			$item.html(item.html);
		else if( item.hasOwnProperty('text') )
			$item.html(item.text);
		else
			$item.html('&nbsp;');
		this.$element.append($item);
	}

	this.$element.css('width', this.width);

	this.$element.offset();

	var x = this.x;
	var y = this.y;

	var width = this.$element.width();
	var height = this.$element.height();

	var $win = $(window);
	var winWidth = $win.width();
	var winHeight = $win.height();

	if( x + width > winWidth - 32 )
		x -= width;

	if( x + width > winWidth - 32 )
		x = winWidth - width - 32;

	if( y + height > winHeight - 32 )
		y -= height;

	if( y + height > winHeight - 32 )
		y = winHeight - height - 32;

	if( x < 32 ) x = 32;
	if( y < 32 ) y = 32;

	this.$element.css({
		left: x + 'px',
		top: y + 'px'
	});
	return this;
};

ContextMenu.onMenuClick = function(e) {
	var $target = $(e.target);
	if( $target.closest('a').length > 0 ) // links in items are not handled and onClick is not called
		return;
	e.stopImmediatePropagation();
	e.preventDefault();

	var $item = $target.closest('.context-menu-item');
	if( $item.length > 0 ) {
		var item = $item.data('cmItem');
		var menu = $(this).data('contextMenu');
		if( typeof item.onClick == 'function' )
			item.onClick.call(menu, item, e);
		if( typeof menu.options.onClick == 'function' )
			menu.options.onClick.call(menu, item, e);
		menu.hide(true);
	}
};

ContextMenu.onItemOver = function(e) {
	var $item = $(this);
	var menu = $item.closest('.context-menu').data('contextMenu');
	var item = $item.data('cmItem');
	if( typeof item.onOver == 'function' )
		item.onOver.call(menu, item, e);
	if( typeof menu.options.onOver == 'function' )
		menu.options.onOver.call(menu, item, e);
};

ContextMenu.onItemOut = function(e) {
	var $item = $(this);
	var menu = $item.closest('.context-menu').data('contextMenu');
	var item = $item.data('cmItem');
	if( typeof item.onOut == 'function' )
		item.onOut.call(menu, item, e);
	if( typeof menu.options.onOut == 'function' )
		menu.options.onOut.call(menu, item, e);
};

$(function() {
	$('body').on('click', function(e) {
		if( ContextMenu.activeMenu && !ContextMenu.ignoreGlobalClick )
			ContextMenu.activeMenu.hide();
	});
});