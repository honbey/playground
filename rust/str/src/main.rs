fn main() {
    println!("Hello, world!");
    let mut s = String::from("hello world");
    let word = first_word(&s);
    println!("the first word is: {}", word);
    s.clear();
}

fn first_word(s: &str) -> &str {
    &s[..1]
}
