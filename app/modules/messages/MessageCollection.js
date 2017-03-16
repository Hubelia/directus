define([
  'app',
  'backbone',
  'moment',
  'core/entries/EntriesCollection',
  'modules/messages/MessageModel'
], function(app, Backbone, moment, EntriesCollection, MessageModel) {

  return EntriesCollection.extend({

    model: MessageModel,

    updateFrequency: 10000,

    filters: {columns_visible: ['from','subject','date_updated'], sort: 'date_updated', sort_order: 'DESC'},

    comparator: function (modelA, modelB) {
      // Order the data by timestamp
      return -moment(modelA.get('date_updated')).diff(moment(modelB.get('date_updated')));
    },

    updateMessages: function() {
      var that = this;
      var data = {
        'max_id': this.maxId
      };

      this.fetch({data: data, remove: false, global: false, error: function(collection, response, options) {
        that.trigger('error:polling');
        that.stopPolling();
      }});

    },

    startPolling: function(ms) {
      this.timerId = window.setInterval(this.updateMessages.bind(this), this.updateFrequency);
    },

    stopPolling: function(ms) {
      clearInterval(this.timerId);
      window.setTimeout(this.startPolling.bind(this), 30000);
    },

    parse: function(response) {
      if (response === null) return [];

      if (response.max_id !== undefined) {
        this.maxId = response.max_id;
        this.unread = response.unread;
        this.total = response.total;
      }

      return response.data;
    },

    // Restore fetch to default style
    fetch: function(options) {
      this.trigger('fetch', this);
      EntriesCollection.prototype.fetch.call(this, options);
    }
  });
});
