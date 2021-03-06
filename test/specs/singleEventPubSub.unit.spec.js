describe('single event pub sub', function(){

   beforeEach(function(){
      this.addMatchers({
         toBeList: listMatcher
      });
   });

   it('is able to subscribe', function(){
   
      var events = singleEventPubSub('someEventName');
      
      expect(function(){
         events.on(function(){});
      }).not.toThrow();

   });
   
   it('is able to notify a subscribed function without an event object', function(){
   
      var events = singleEventPubSub('someEventName'),
          listener = jasmine.createSpy('listener');

      events.on(listener);
      
      events.emit();
      
      expect(listener).toHaveBeenCalled();
   });
   
   it('is able to notify a subscribed function with a event parameter', function(){
   
      var events = singleEventPubSub('someEventName'),
          listener = jasmine.createSpy('listener');      

      events.on(listener);
      
      events.emit('somethingFunky');
      
      expect(listener).toHaveBeenCalledWith('somethingFunky');
   });   

   it('notifies of new listeners when added without an id', function() {
      var newListener      = singleEventPubSub('newListener'), 
          someEventName    = singleEventPubSub('someEventName', newListener),
          listenerListener = jasmine.createSpy('listenerListener');      

      newListener.on(listenerListener);
      someEventName.on(noop);
            
      expect(listenerListener).toHaveBeenCalledWith('someEventName', noop, noop);
   });
   
   it('notifies of new listeners when added with an id', function() {
      var newListener      = singleEventPubSub('newListener'), 
          someEventName    = singleEventPubSub('someEventName', newListener),
          listenerListener = jasmine.createSpy('listenerListener');      

      newListener.on(listenerListener);
      someEventName.on(noop, 'id1');
            
      expect(listenerListener).toHaveBeenCalledWith('someEventName', noop, 'id1');   
   });

   it('notifies multiple listeners of the same event', function(){
   
      var events = singleEventPubSub('someEventName'),
          listenerA = jasmine.createSpy('listenerA'),
          listenerA2 = jasmine.createSpy('listenerA2');
      
      events.on(listenerA);
      events.on(listenerA2);
      
      events.emit();
      
      expect(listenerA).toHaveBeenCalled();
      expect(listenerA2).toHaveBeenCalled();           
   });
            
   it('can pass through multiple parameters', function(){
   
      var events = singleEventPubSub('someEventName'),
          listener = jasmine.createSpy('listener');
       
      events.on(listener);
      
      events.emit('a', 'b', 'c');
      
      expect(listener).toHaveBeenCalledWith('a', 'b', 'c');
   });
   
   it('can pass multiple parameters to multiple listeners', function(){
   
      var events    = singleEventPubSub('someEventName'),
          listener  = jasmine.createSpy('listener' ),
          listener2 = jasmine.createSpy('listener2');
       
      events.on(listener );
      events.on(listener2);
      
      events.emit('a', 'b', 'c');
      
      expect(listener ).toHaveBeenCalledWith('a', 'b', 'c');
      expect(listener2).toHaveBeenCalledWith('a', 'b', 'c');
   });      
   
   it('allows many listeners to be registered for an event', function(){
   
      var events = singleEventPubSub('someEventName'),
          listenerA = jasmine.createSpy('listenerA');

      for (var i = 0; i < 10; i++) {
         // listen ten times
         events.on(listenerA);
      }

      for (var j = 0; j < 3; j++) {
         // emit 3 times
         events.emit();
      }         
                   
      expect(listenerA.calls.length).toBe(30);           
   });   
   
   it('has a chainable on function', function(){
   
      var events = singleEventPubSub('someEventName'),
          listenerA = jasmine.createSpy('listenerA'),
          listenerB = jasmine.createSpy('listenerB');
      
      events.on(listenerA)
            .on(listenerB)
            .emit();
      
      expect(listenerA).toHaveBeenCalled();
      expect(listenerB).toHaveBeenCalled();           
   });      
      
   it('allows an event to be removed', function(){
   
      var events = singleEventPubSub('someEventName'),
          listener1 = jasmine.createSpy('listener1'),
          listener2 = jasmine.createSpy('listener2');
      
      events.on(listener1);
      events.on(listener2);

      events.emit();
      
      expect(listener1.calls.length).toBe(1);      
      
      events.un(listener1);      

      events.emit();

      expect(listener1.calls.length).toBe(1);
      expect(listener2.calls.length).toBe(2);      
   });
   
   it('allows an event to be removed by an id', function(){
      var events = singleEventPubSub('someEventName'),
          listener1 = jasmine.createSpy('listener1'),
          listener2 = jasmine.createSpy('listener2');
      
      events.on(listener1, 'FOO_ID');
      events.on(listener2, 'BAR_ID');

      events.emit();
      
      expect(listener1.calls.length).toBe(1);      
      
      events.un('FOO_ID');      

      events.emit();

      expect(listener1.calls.length).toBe(1);
      expect(listener2.calls.length).toBe(2);

      events.un('BAR_ID');
      events.emit();          
           
      expect(listener2.calls.length).toBe(2);       
   })
   
   it('does not fire removeListener if nothing is removed', function() {
      var newListener            = singleEventPubSub('newListener'),
          removeListener         = singleEventPubSub('removeListener'),      
          events                 = singleEventPubSub('someEventName', newListener, removeListener),   
          removeListenerListener = jasmine.createSpy('removeListenerListener'),
          fooListener            = jasmine.createSpy('fooListener');
      
      removeListener.on(removeListenerListener);

      events.on(fooListener);
      events.un('wrong_item');
                              
      expect(removeListenerListener).not.toHaveBeenCalled();         
   });
   
   it('fires removeListener when a listener is removed', function(){
      var newListener            = singleEventPubSub('newListener'),
          removeListener         = singleEventPubSub('removeListener'),      
          events                 = singleEventPubSub('someEventName', newListener, removeListener),   
          removeListenerListener = jasmine.createSpy('removeListenerListener'),
          fooListener            = jasmine.createSpy('fooListener');
      
      removeListener.on(removeListenerListener);

      events.on(fooListener);
      events.un(fooListener);
                              
      expect(removeListenerListener).toHaveBeenCalled();     
   })
   
   it('does not crash if asked to emit without listeners', function(){
   
      var events = singleEventPubSub('someEventName');
      
      expect(function(){      
         events.emit('unknown event');      
      }).not.toThrow();
   });
   
   describe('listeners method', function(){
      it('can return listeners when there haven\'t been any', function(){
         var events = singleEventPubSub('someEventName');
         
         expect( events.listeners('testEventType') ).toBeFalsy();      
      })
      
      it('can return listeners when one has been added', function(){
         var events = singleEventPubSub('someEventName');
         
         events.on(noop);
         
         expect( events.listeners('testEventType') ).toBeList(list(noop));               
      })
      
      it('can return listeners when second is added', function(){
         var events = singleEventPubSub('someEventName');
         
         events.on(noop);
         events.on(noop);
         
         expect( events.listeners('testEventType') ).toBeList(list(noop, noop));               
      })
      
      it('can return listeners when one is removed', function(){
         var events = singleEventPubSub('someEventName');
         
         events.on(noop);
         events.on(noop);
         events.un(noop);
         
         expect( events.listeners('testEventType') ).toBeList(list(noop));               
      })
      
      it('can return listeners when all are removed', function(){
         var events = singleEventPubSub('someEventName');
         
         events.on(noop);
         events.on(noop);
         events.un(noop);
         events.un(noop);
         
         expect( events.listeners('testEventType') ).toBeFalsy();               
      })                        
   })
   
         
});