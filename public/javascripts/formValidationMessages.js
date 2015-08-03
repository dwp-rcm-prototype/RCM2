function initFormErrorMessages() {

    var messages = [];
    messages['fraud-suspect'] = '' +
    '<p>Please make sure you enter at least</p>' +
    '<ul class="list-bullet error-summary-list">' +
    '<li>A name, approximate age (or date of birth) and an address</li>' +
    '</ol>';

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
