use sycamore::prelude::*;
use sycamore::web::tags::*;

#[component]
fn App() -> View {
    div()
        .class("min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center")
        .children(
            div()
                .class("w-32 h-32 rounded-full bg-indigo-200 dark:bg-indigo-700")
                .children(
                    svg()
                        .class("animate-spin text-indigo-600 dark:text-indigo-400")
                        .xmlns("http://www.w3.org/2000/svg")
                        .fill("none")
                        .viewBox("0 0 24 24")
                        .children((
                            circle()
                                .class("opacity-25")
                                .cx("12")
                                .cy("12")
                                .r("10")
                                .stroke("currentColor")
                                .strokeWidth("4"),
                            path()
                                .class("opacity-75")
                                .fill("currentColor")
                                .d(
                                    "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l
3-2.647z",
                                ),
                        )),
                ),
        )
        .into()
}

fn main() {
    console_error_panic_hook::set_once();
    sycamore::render(App);
}
