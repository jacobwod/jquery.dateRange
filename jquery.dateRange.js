(function($){
   $.fn.dateRange = function(options)
   {
      var defaults = {selected: null, startWith: null, minimumDate: null, maximumDate: null};
      var opts = $.extend({}, defaults, options);
      var months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
      var abbreviations = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec');
      var daySelector = 'td:not(.m):not(:empty)';
      return this.each(function() 
      {
         if (this.dateRange) { return false; }
      
         var $input = $(this);
         
         // Map .val() to .text() if it's a <span>
         if ($input.is('span'))
           $input.val = $input.text;
         
         var $container, selecting, selected, oldSelected, $prev, $next, $inputStart, $inputEnd, dropdownDates;
         var self = 
         {
            initialize: function() 
            {
               dropdownDates = self.initializeDropdownDates();
               
               $container = self.initializeContainer().hide();
               $prev = $container.find('div.prev').click(self.loadPrevious);
               $next = $container.find('div.next').click(self.loadNext);
               
               $inputStart = $container.find('.inputStart');
               $inputEnd = $container.find('.inputEnd');
               $inputStart.bind('blur', self.inputEntered);
               $inputEnd.bind('blur', self.inputEntered);
               
               $container.find('button.apply').click(self.applyButtonClicked);
               $container.find('button.cancel').click(self.cancelButtonClicked);
               $container.find('select.rangeDropdown').bind('change', self.rangeDropdownChanged);
               
               var now = new Date();
               now.setDate(1);
               var prev = new Date(now.getFullYear(), now.getMonth()-1, 1);
               $container.append(self.buildMonth(prev));
               $container.append(self.buildMonth(now));
               
               $input
                 .click(function() {
                    self.show();
                    return false;
                 })
                 .keydown(function(e) {
                   if (e.keyCode == 13) 
                     self.entered();
                 });
               
               $(document)
                 .click(self.cancelButtonClicked)
                 .keydown(function(e) {
                   if (e.keyCode == 27)
                     self.cancelButtonClicked(e);
                 });

               $container.delegate(daySelector, 'click', self.clicked);
               $container.click(function(){return false;});
               
               if (opts.startWith != null)
               {
                 selected = opts.startWith;
                 oldSelected = selected;
                 self.rangeSelected();
                 
                 // Make sure the main input shows the right value
                 $input.val(self.format(selected[0]) + ' - ' + self.format(selected[1]));
               }
            },
            entered: function()
            {
              var values = $input.val().split('-');
              if (values.length != 2) { return false; }
              
              var from = self.parseDate(values[0].replace(/^\s*/, '').replace(/\s*$/, ''));
              var to = self.parseDate(values[1].replace(/^\s*/, '').replace(/\s*$/, ''));
              if (from == null || to == null) { return false; }
              
              selected = [from, to];
              self.rangeSelected();
              return false;
            },
            parseDate: function(value)
            {
              return new Date(value);
            },
            show: function()
            {
               selecting = [];
               $container.show().parents('.calendarWrap').addClass('dateRangeVisible');
            },
            hide: function()
            {
               $container.hide().parents('.calendarWrap').removeClass('dateRangeVisible');
            },
            clicked: function()
            {
               var $td = $(this).addClass('selected');
               var date = $td.closest('table').data('date');
               selecting.push(new Date(date.getFullYear(), date.getMonth(), $td.text()));
               if (selecting.length == 2)
               {
                  selected = selecting;
                  self.rangeSelected();
               }
            },
            inputEntered: function(e) {
              e.preventDefault();
              var $t = $(this);
              var val = $t.val();
              selecting.push(new Date(val));
              if (selecting.length == 2) {
                selected = selecting;
                self.rangeSelected();
              }
            },
            rangeSelected: function()
            {
               if (selected[0] > selected[1])
               {
                  var x = selected[0];
                  selected[0] = selected[1];
                  selected[1] = x;
               }
               self.highlight($container.find('table:first'));
               self.highlight($container.find('table:last'));

               $inputStart.val(self.formatInput(selected[0]));
               $inputEnd.val(self.formatInput(selected[1]));
               self.selectCorrectDropdownValue();

               selecting = [];
               if (opts.selected != null) { 
                 opts.selected(selected); 
               } 
            },
            selectCorrectDropdownValue: function() {
              var $dropdown = $container.find('select.rangeDropdown'),
                  dates = dropdownDates,
                  start = selected[0].getTime(),
                  end   = selected[1].getTime(),
                  found = false;
              
              $(dates).each(function() {
                if (start == this.startdate.getTime() && end == this.enddate.getTime()) {
                  $dropdown.val(this.value);
                  found = true;
                }
              });
              
              if (found == false) {
                $dropdown.val('custom');
              }
            },
            applyButtonClicked: function(e) {
              e.preventDefault();
              oldSelected = selected;
              $input.val(self.format(selected[0]) + ' - ' + self.format(selected[1]));
              self.hide();
            },
            cancelButtonClicked: function(e) {
              e.preventDefault();
              selected = oldSelected;
              self.rangeSelected();
              self.hide();
            },
            rangeDropdownChanged: function(e) {
              var option = $(this).find(':selected');
              selected = [];
              selected[0] = option.data('startdate');
              selected[1] = option.data('enddate');
              self.rangeSelected();
            },
            highlight: function($table)
            {
               if (selected == null || selected.length != 2) { return; }
               
               $table.find('td.highlight').removeClass('highlight');
               var startDate = $table.data('date');
               var endDate = new Date(startDate.getFullYear(), startDate.getMonth()+1, 0);
               if (startDate > selected[1] || endDate < selected[0]) { return; }
               
               var $tds = $table.find(daySelector);
               var start = selected[0].getMonth() < startDate.getMonth() || selected[0].getFullYear() < startDate.getFullYear() ? 0 : selected[0].getDate()-1;
               var end = selected[1].getMonth() > endDate.getMonth() || selected[1].getFullYear() > endDate.getFullYear() ? $tds.length : selected[1].getDate();
               for(var i = start; i < end; ++i)
               {
                  $tds.get(i).className = 'highlight';
               }               
            },
            loadPrevious: function()
            {               
               $container.children('table:eq(1)').remove();
               var date = $container.children('table:eq(0)').data('date');
               $container.find('div.nav').after(self.buildMonth(new Date(date.getFullYear(), date.getMonth()-1, 1)));
            },
            loadNext: function()
            {               
               $container.children('table:eq(0)').remove();
               var date = $container.children('table:eq(0)').data('date');
               $container.find('table').after(self.buildMonth(new Date(date.getFullYear(), date.getMonth()+1, 1)));            
            },
            initializeDropdownDates: function() {
              var protoNow = new Date();
              var now = new Date(protoNow.getFullYear(), protoNow.getMonth(), protoNow.getDate());
              var datesArray = [
                {
                  text:  'Custom',
                  value: 'custom',
                  startdate: new Date(1),
                  enddate:   new Date(1)
                },
                {
                  text:  'Today',
                  value: 'today',
                  startdate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                {
                  text:  'Yesterday',
                  value: 'yesterday',
                  startdate: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1),
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate()-1)
                },
                {
                  text:  'This week',
                  value: 'thisweek', // 86400000  = one day in mili
                  startdate: new Date(now - (now.getDay() % 7)*86400000), // Go back so many days that have passed since day 0 (Sunday)
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                {
                  text:  'Last week',
                  value: 'lastweek',
                  startdate: new Date(now - ((now.getDay() % 7)*86400000) - 7*86400000), // Last Sunday -7 days
                  enddate:   new Date(now - (now.getDay() % 7)*86400000 - 86400000) // Last Sunday -1 day
                },
                {
                  text:  'Last 7 days',
                  value: 'last7days',
                  startdate: new Date(now.getFullYear(), now.getMonth(), now.getDate()-6), // Today and 6 last days gives 7 in total
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                {
                  text:  'Last 14 days',
                  value: 'last14days',
                  startdate: new Date(now.getFullYear(), now.getMonth(), now.getDate()-13),
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                {
                  text:  'This month',
                  value: 'thismonth',
                  startdate: new Date(now.getFullYear(), now.getMonth(), 1),
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                {
                  text:  'Last month',
                  value: 'lastmonth',
                  startdate: new Date(now.getFullYear(), now.getMonth()-1, 1),
                  enddate:   new Date(now.getFullYear(), now.getMonth(), 0)
                },
                {
                  text:  'Last 30 days',
                  value: 'last30days',
                  startdate: new Date(now.getFullYear(), now.getMonth(), now.getDate()-29), 
                  enddate:   new Date(now.getFullYear(), now.getMonth(), now.getDate())
                }
              ];
              return datesArray;
            },
            initializeContainer: function()
            {
               $input.wrap($('<div>').addClass('calendarWrap'));
               var $container = $('<div>').addClass('calendar').insertAfter($input);
               var $nav = $('<div>').addClass('nav').appendTo($container);
               $nav.html('<div class="prev">&lsaquo;</div><div class="next">&rsaquo;</div>');
               
               var $sidebar = $('<div>').addClass('sidebar').appendTo($container);
               var $form = $('<form>').attr({
                 method: 'get',
                 action: document.location
               }).appendTo($sidebar);
               
               var $dropdown = $('<select>').addClass('rangeDropdown');
               $(dropdownDates).each(function() {
                 var $option = $('<option>').val(this.value).text(this.text).data({startdate: this.startdate, enddate: this.enddate});
                 $option.appendTo($dropdown);
               });
               
               $('<fieldset>').addClass('dropdown').append('<label>Time period</label>').append($dropdown).appendTo($form);
               $('<fieldset class="inputs"><input type="text" value="" class="inputStart" maxlength="10" /> - <input type="text" value="" class="inputEnd" maxlength="10" /></fieldset>').appendTo($form);
               $('<fieldset class="buttons"><button class="cancel">Cancel</button><button type="submit" class="apply">Apply</button></fieldset>').appendTo($form);
               return $container;
            },
            buildMonth: function(date)
            {
               var first = new Date(date.getFullYear(), date.getMonth(), 1);
               var last = new Date(date.getFullYear(), date.getMonth()+1, 0);
               var firstDay = first.getDay();
               var totalDays = last.getDate();
               var weeks = Math.ceil((totalDays + firstDay) / 7);
               
               var table = document.createElement('table');

               
               for (var i = 0, count = 1; i < weeks; ++i)
               {
                  var row = table.insertRow(-1);
                  for(var j = 0; j < 7; ++j, ++count)
                  {
                     var cell = row.insertCell(-1);
                     if (count > firstDay && count <= totalDays+firstDay)
                     {
                        cell.innerHTML = count - firstDay;
                     }
                  }
               }
               
               var header = table.insertRow(0);
               var cell = header.insertCell(-1);
               cell.innerHTML = months[date.getMonth()] + ' ' + date.getFullYear();
               cell.className = 'm'; //very stupid IE (all versions) fix
               cell.colSpan = 7;
               
               var $table = $(table).data('date', date);
               self.highlight($table);
               
               if (opts.minimumDate && opts.minimumDate >= first) { $prev.hide() } else { $prev.show(); }
               if (opts.maximumDate && opts.maximumDate <= last) { $next.hide() } else { $next.show(); }
               
               return $table;
            },
            format: function(date)
            {
               return abbreviations[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
            },
            formatInput: function(date) {
              return date.getMonth()+1 + '/' + date.getDate() + '/' + date.getFullYear();
            }
         };
         this.dateRange = self;
         self.initialize();
      });
   }
})(jQuery);