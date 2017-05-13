'use strict';
const should = require('chai').should();

let messagesReceived = 0;
let pubsubFactory = require('../lib/pubsub_factory');
let pubsub = pubsubFactory({ logLevel: 'trace' });

describe('pubsub', function () {
    beforeEach(function () {
        messagesReceived = 0;
    });

    it('should receive any event', function (done) {
        pubsub.onAny(null, envelope => messagesReceived++).then(subscriber => {
            pubsub.publish({ some: 'data' }, 'channel1.group1.event1');

            setTimeout(() => {
                messagesReceived.should.equal(1);
                subscriber.unsubscribe(done);
            }, 100);
        })
    });

    it('should receive child topics', function (done) {
        let pattern = pubsub.getPattern('channel1');
        pubsub.on(pattern.subTopicsPattern, envelope => messagesReceived++).then(subscriber => {
            pubsub.publish({ some: 'data' }, 'channel1.group1.event1');

            setTimeout(() => {
                messagesReceived.should.equal(1);
                subscriber.unsubscribe(done);
            }, 100);
        })
    });

    it('should not receive events that weren\'t subscribed to', function (done) {
        pubsub.onAny('channel2', envelope => messagesReceived++).then(subscriber => {
            pubsub.publish({ some: 'data' }, 'channel1.group1.event1');

            setTimeout(() => {
                messagesReceived.should.equal(0);
                subscriber.unsubscribe(done);
            }, 100);
        })
    });

    it('should receive by exact topic-match', function (done) {
        pubsub.on('channel1.group1.event1', envelope => messagesReceived++).then(subscriber => {
            pubsub.publish({ some: 'data' }, 'channel1.group1.event1');
            pubsub.publish({ some: 'data' }, 'channel1.group1.event2');

            setTimeout(() => {
                messagesReceived.should.equal(1);
                subscriber.unsubscribe(done);
            }, 100);
        })
    });

    it('should by custom pattern', function (done) {
        pubsub.on('channel1#group1#event1*', envelope => messagesReceived++).then(subscriber => {
            pubsub.publish({ some: 'data' }, 'channel1#group1#event1#from:some-publisher');
            pubsub.publish({ some: 'data' }, 'channel1.group1.event1');

            setTimeout(() => {
                messagesReceived.should.equal(1);
                subscriber.unsubscribe(done);
            }, 100);
        })
    });

    it('should subscribe to different event groups', function (done) {
        let group1MessagesReceived = 0;
        let group2MessagesReceived = 0;

        pubsub.onAny('channel1.group1', envelope => group1MessagesReceived++).then(subscriber1 => {
            pubsub.onAny('channel1.group2', envelope => group2MessagesReceived++).then(subscriber2 => {
                pubsub.publish({ some: 'data' }, 'channel1.group1.event1');
                pubsub.publish({ some: 'data' }, 'channel1.group1.event1');
                pubsub.publish({ some: 'data' }, 'channel1.group2.event2');

                setTimeout(() => {
                    subscriber1.unsubscribe();
                    subscriber2.unsubscribe();

                    group1MessagesReceived.should.equal(2);
                    group2MessagesReceived.should.equal(1);

                    done();
                }, 100);
            })
        })
    });
});