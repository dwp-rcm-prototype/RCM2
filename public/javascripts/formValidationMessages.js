function initFormErrorMessages() {

    var messages = [];
    messages['fraud-suspect'] = '' +
    '<p>Please make sure you enter at least</p>' +
    '<ul class="list-bullet error-summary-list">' +
    '<li>A name, approximate age (or date of birth) and an address</li>' +
    '<li>A name, approximate age (or date of birth) and either a phone number or email address</li>' +
    '<li>A National insurance number and an approximate age (or date of birth)</li>' +
    '<li>A National insurance number and an address</li>' +
    '</ol>';

    messages['details'] = '' +
    '<p><strong>You need to know more about the person. <br>Check that you have selected as many as you can.</strong></p>';

    messages['fraud-suspect__3strikes'] = '' +
    '<p>' +
    'Having trouble? Call us on 0800 854 440.<br>' +
    'Otherwise please make sure you enter at least' +
    '</p>' +
    '<ul class="list-bullet error-summary-list">' +
    '<li>A name, approximate age (or date of birth) and either an address, phone number or email address</li>' +
    '<li>A National insurance number and either an approximate age (or date of birth) or an address</li>' +
    '</ul>';

    return messages;
}
