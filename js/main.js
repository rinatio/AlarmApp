jQuery(function($) {

  var Alarms = Backbone.Collection.extend({
    initialize: function() {
      var alarms = JSON.parse($.cookie('alarms')) || [];
      alarms = _.map(alarms, function(val) {return {id: val}});
      this.reset(alarms);
      this.on('add remove', this.updateCookie, this);
      this.on('alert', this.remove, this);
    },

    updateCookie: function() {
      var ids = this.pluck('id');
      $.cookie('alarms', JSON.stringify(ids), {expires: 365});
    },

    comparator: function(a, b) {
      return a.id > b.id;
    }
  });

  var Form = Backbone.View.extend({
    el: 'form',
    events: {
      'submit': 'submit'
    },
    render: function() {
      this.$("#time").datetimepicker();
    },

    submit: function(e) {
      e.preventDefault();
      var time = moment(this.$('#time').val(), 'MM/DD/YYYY HH:mm')
      if (!time || !time.isValid()) {
        this.$('.control-group').addClass('error');
        return;
      }
      this.$('.control-group').removeClass('error');
      this.collection.add({id: time.valueOf()});
    }
  });

  var Carousel = Backbone.View.extend({
    el: '#alarms',
    events: {
      'click .destroy': 'clickDestroy'
    },
    template:_.template('\
      <li class="alarm">\
        <img src="img/analogue-clock.png" onload="$(this).parent().addClass(\'loaded\')">\
        </img>\
        <img class="hour" style="-moz-transform:<%= hrotate%>;-webkit-transform:<%= hrotate%>" src="../img/hourhand.png"/>\
        <img class="min" style="-moz-transform:<%= mrotate%>;-webkit-transform:<%= mrotate%>" src="../img/minhand.png"/>\
        <span class="digit"><%= time %></span>\
        <a href="javascript:void(0)" class="destroy" data-id="<%= model.id %>">удалить</a>\
      </li>'
    ),
    initialize: function() {
      this.collection.on('add remove', this.render, this);
    },

    render: function() {
      var carousel = $('<ul class="jcarousel-skin-tango"></ul>');
      this.$el.html(carousel);
      this.collection.each(function(model) {
        var time = moment(model.id);
        var hours = time.hours();
        var mins = time.minutes();
        var hdegree = hours * 30 + (mins / 2);
        $(this.template({
          time: time.format('hh:mm A'),
          model: model,
          hrotate: "rotate(" + hdegree + "deg)",
          mrotate: "rotate(" + mins*6 + "deg)"
        })).appendTo(carousel);
      }, this);
      carousel.jcarousel({
        scroll: 1,
        visible: null,
        itemFallbackDimension: 600
      });
    },

    clickDestroy: function(e) {
      e.preventDefault();
      var id = $(e.target).data('id');
      var model = this.collection.get(id);
      if (model) {
        this.collection.remove(model);
      }
    }
  });

  var Toast = Backbone.View.extend({
    el: '#toasts',
    template: _.template('\
      <div class="alert alert-success">\
        Alarm App<br />\
        <i class="icon-ok"></i>\
        <%= time.format("hh:mm a") %>\
      </div>\
    '),

    initialize: function(options) {
      _.bindAll(this, 'checkAlerts');
      this.collection.on('alert', this.render, this);
      this.checkAlerts();
      setInterval(this.checkAlerts, 1000);
    },

    render: function(model) {
      var toast = $(this.template({
        time: moment(model.id)
      }));
      this.$el.append(toast);
      toast.alert();
      _.delay(function() {
        toast.alert('close')
      }, 10000);
    },

    checkAlerts: function() {
      var collection = this.collection,
        model;
      for (var i = collection.length - 1; i >= 0; i--) {
        model = collection.at(i);
        if (model.id < Date.now()) {
          collection.trigger('alert', model);
        }
      }
    }
  });

  var alarms = new Alarms;
  var app = new Form({collection: alarms});
  app.render();
  var toast = new Toast({collection: alarms});
  var carousel = new Carousel({collection: alarms});
  carousel.render();
});
