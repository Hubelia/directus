define([
  'app',
  'underscore',
  'backbone',
  'core/notification'
], function (app, _, Backbone, Notification) {

  return Backbone.Layout.extend({

    template: 'modules/messages/message-new',

    events: {
      'keyup textarea': 'toggleButtons',
      'keydown textarea': 'toggleButtons',
      'change textarea': 'toggleButtons',
      'focus textarea': 'toggleButtons',
      'blur textarea': 'toggleButtons',
      'click .js-button-send': 'sendMessage'
    },

    toggleButtons: function (event) {
      var $el = $(event.currentTarget);
      var $group = this.$('.compose .button-group .button');

      if ($el.val().trim().length > 0) {
        $group.removeClass('hidden');
      } else {
        $group.addClass('hidden');
      }
    },

    sendMessage: function (event) {
      event.preventDefault();

      var data = this.$('form').serializeObject();

      if (this.options.parentModel) {
        this.sendResponse(data);
      } else {
        this.sendNewMessage(data);
      }
    },

    sendNewMessage: function (data) {
      var options = {};
      var collection = this.model.collection;

      data.read = 1;
      options.wait = true;
      options.success = function (model, resp) {
        collection.add(model);
        // @NOTE: Do we need/use those warning message?
        if (resp.warning) {
          Notification.warning(null, resp.warning, {timeout: 5000});
        }
      };

      this.model.save(data, options);
    },

    sendResponse: function (data) {
      var parentMessageModel = this.options.parentModel;
      var newResponseModel = this.model;
      var collection = parentMessageModel.get('responses');

      var recipients = _.map(parentMessageModel.get('recipients').split(','), function(id) {
        return '0_' + id;
      });

      recipients.push('0_' + newResponseModel.get('from'));

      var attrs = _.extend({
        'from': app.users.getCurrentUser().get('id'),
        'subject': 'RE: ' + parentMessageModel.get('subject'),
        'recipients': recipients.join(','),
        'response_to': parentMessageModel.id,
        'responses': []
      }, data);
      var self = this;
      var success = function (model) {
        collection.add(model);
        // create a new model after one has been successfully sent
        self.model = self.model.clone();
        self.model.clear();
        self.model.set('from', app.users.getCurrentUser().id);

        self.render();
      };

      // @TODO: Get ID after create message
      // Create an API endpoint for new messages
      // returning a JSON with the new message
      newResponseModel.save(attrs, {wait: true, success: success});
      // this.render();
    },

    serialize: function () {
     var user = app.users.getCurrentUser();

     return {
       model: this.model,
       isResponse: this.options.parentModel,
       view: {
         recipients: {
           parent: this,
           model: this.model,
           attr: 'recipients',
           options: {
             structure: this.model.structure
           }
         },
         attachments: {
           parent: this,
           model: this.model,
           attr: 'attachment',
           options: {
             structure: this.model.structure
           }
         }
       },
       user: user.toJSON()
     };
    }
  });
});
