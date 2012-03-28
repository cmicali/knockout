
function copyDomNodeChildren(domNode) {
    var copy = [];
    for (var i = 0; i < domNode.childNodes.length; i++)
        copy.push(domNode.childNodes[i]);
    return copy;
}

describe('Compare Arrays', {
    'Should recognize when two arrays have the same contents': function () {
        var subject = ["A", {}, function () { } ];
        var compareResult = ko.utils.compareArrays(subject, subject.slice(0));

        value_of(compareResult.length).should_be(subject.length);
        for (var i = 0; i < subject.length; i++) {
            value_of(compareResult[i].status).should_be("retained");
            value_of(compareResult[i].value).should_be(subject[i]);
        }
    },

    'Should recognize added items': function () {
        var oldArray = ["A", "B"];
        var newArray = ["A", "A2", "A3", "B", "B2"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "retained", value: "A", from: 0, to: 0 },
            { status: "added", value: "A2", to: 1 },
            { status: "added", value: "A3", to: 2 },
            { status: "retained", value: "B", from: 1, to: 3 },
            { status: "added", value: "B2", to: 4 }
        ]);
    },

    'Should recognize deleted items': function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = ["B", "C", "E"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "deleted", value: "A", from: 0 },
            { status: "retained", value: "B", from: 1, to: 0 },
            { status: "retained", value: "C", from: 2, to: 1 },
            { status: "deleted", value: "D", from: 3 },
            { status: "retained", value: "E", from: 4, to: 2 }
        ]);
    },

    'Should recognize mixed edits': function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = [123, "A", "E", "C", "D"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "added", value: 123, to: 0 },
            { status: "retained", value: "A", from: 0, to: 1 },
            { status: "deleted", value: "B", from: 1 },
            { status: "added", value: "E", to: 2, moveFrom: 4 },
            { status: "retained", value: "C", from: 2, to: 3 },
            { status: "retained", value: "D", from: 3, to: 4 },
            { status: "deleted", value: "E", from: 4, moveTo: 2 }
        ]);
    },
    
    'Should recognize replaced array': function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = ["F", "G", "H", "I", "J"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        // the order of added and deleted doesn't really matter
        compareResult.sort(function(a, b) { return a.status.localeCompare(b.status) });
        value_of(compareResult).should_be([
            { status: "added", value: "F", to: 0},
            { status: "added", value: "G", to: 1},
            { status: "added", value: "H", to: 2},
            { status: "added", value: "I", to: 3},
            { status: "added", value: "J", to: 4},
            { status: "deleted", value: "A", from: 0},
            { status: "deleted", value: "B", from: 1},
            { status: "deleted", value: "C", from: 2},
            { status: "deleted", value: "D", from: 3},
            { status: "deleted", value: "E", from: 4}
        ]);
    }
});

describe('Array to DOM node children mapping', {
    before_each: function () {
        testNode = document.createElement("div");
    },

    'Should populate the DOM node by mapping array elements': function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        value_of(testNode.childNodes.length).should_be(4);
        value_of(testNode.childNodes[0].innerHTML).should_be("A1");
        value_of(testNode.childNodes[1].innerHTML).should_be("A2");
        value_of(testNode.childNodes[2].innerHTML).should_be("B1");
        value_of(testNode.childNodes[3].innerHTML).should_be("B2");
    },

    'Should only call the mapping function for new array elements': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            return null;
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(mappingInvocations).should_be(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "A2", "B"], mapping);
        value_of(mappingInvocations).should_be(["A2"]);
    },

    'Should retain existing node instances if the array is unchanged': function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var existingInstances = copyDomNodeChildren(testNode);

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var newInstances = copyDomNodeChildren(testNode);

        value_of(newInstances).should_be(existingInstances);
    },

    'Should insert added nodes at the corresponding place in the DOM': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B"]);
        value_of(mappingInvocations).should_be(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["first", "A", "middle1", "middle2", "B", "last"]);
        value_of(mappingInvocations).should_be(["first", "middle1", "middle2", "last"]);
    },

    'Should remove deleted nodes from the DOM': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["first", "A", "middle1", "middle2", "B", "last"]);
        value_of(mappingInvocations).should_be(["first", "A", "middle1", "middle2", "B", "last"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B"]);
        value_of(mappingInvocations).should_be([]);
    },

    'Should handle sequences of mixed insertions, deletions, and moves': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem || "null";
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A"]);
        value_of(mappingInvocations).should_be(["A"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["B"], mapping); // Delete and replace single item
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["B"]);
        value_of(mappingInvocations).should_be(["B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B", "C"], mapping); // Add at beginning and end
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B", "C"]);
        value_of(mappingInvocations).should_be(["A", "C"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["C", "B", "A"], mapping); // Move items
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["C", "B", "A"]);
        value_of(mappingInvocations).should_be([]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, [1, null, "B"], mapping); // Add to beginning; delete from end
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["1", "null", "B"]);
        value_of(mappingInvocations).should_be([1, null]);
    }
});