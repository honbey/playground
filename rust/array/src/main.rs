fn main() {
    println!("Hello, world!");
    let arr: &[u8] = &[1, 2];
    if let [x, ..] = arr {
        assert_eq!(x, &1);
    };

    let one = [1, 2, 3];
    let two: [u8; 3] = [1, 2, 3];
    let blank1 = [0; 3];
    let blank2: [u8; 3] = [0; 3];

    let arrays: [[u8; 3]; 4] = [one, two, blank1, blank2];

    for a in &arrays {
        println!("{:?}", a);
        for n in a.iter() {
            println!("{:?}", n);
        }
    }

    let arr_def: &mut [String] = &mut [String::new(), String::from("hello")];
    if let [x, ..] = arr_def {
        assert_eq!(x, &String::new());
    };
}
