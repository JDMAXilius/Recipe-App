# Pickers
URL: https://developer.apple.com/design/human-interface-guidelines/pickers

## Summary
A picker shows one or more scrollable lists of distinct values to choose from, with styles that vary in values and appearance. Date pickers add ways to choose, such as a calendar view or numeric keypad entry; values and their order follow the device language/location.

## Best practices
- Use a picker for medium-to-long lists of items.
- For a short list, consider a pull-down button instead; a picker can add too much visual weight.
- For a very large set, use a list or table, which can resize and include an index for fast jumps.
- Order values predictably and logically (e.g., alphabetized countries) so people can guess hidden values.
- Don't switch views to show a picker; display it in context, below or near the field being edited.
- A picker typically appears at the bottom of a window or in a popover.
- Consider coarser minute intervals in date pickers, as long as the interval divides evenly into 60.
- Use a compact date picker when space is tight.

## iOS specifics
- Date picker styles: Compact (button opening an editable modal), Inline (wheels for time only; inline calendar for dates and times), Wheels (scrolling wheels, also accepts keyboard entry), Automatic (system chooses).
- Date picker modes: Date (month, day, year), Time (hours, minutes, optional AM/PM), Date and time, Countdown timer.
- Countdown timer mode isn't available in inline or compact styles.
- Compact style shows the current value in the app's accent color; tapping opens a modal with a calendar editor and time picker; people can make multiple edits, then tap outside to confirm.
- Values and order depend on device location.

## Specs & numbers
- Default minute list: 60 values (0 to 59).
- Custom minute interval must divide evenly into 60; example quarter-hour intervals: 0, 15, 30, 45.
- iOS date picker: 4 styles (Compact, Inline, Wheels, Automatic) and 4 modes (Date, Time, Date and time, Countdown timer).
- Countdown timer maximum: 23 hours and 59 minutes.
- Change log: June 5, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Tap a "Date" row in a form to reveal a compact date button in accent color that opens a calendar modal. / Don't: Navigate to a whole new screen just to pick a date.
- Do: Use a wheel picker for a long list like countries, sorted A to Z. / Don't: Present countries in an unpredictable order on a wheel.
- Do: Use a pull-down menu for a 3-option choice (Small/Medium/Large). / Don't: Use a full-height wheel picker for 3 options.
- Do: Offer reminder minutes as 0, 15, 30, 45. / Don't: Force scrolling through all 60 minutes when only quarter hours matter.
- Do: Use a searchable, indexed list for hundreds of items. / Don't: Cram a very large set into a picker wheel.
- Do: Show the picker at the bottom of the screen near the field being edited. / Don't: Place the picker far from the field it fills.
