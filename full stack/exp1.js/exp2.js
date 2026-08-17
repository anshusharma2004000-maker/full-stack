function maxSumNonAdjacent(arr) {
    let include = 0;
    let exclude = 0;

    for (let num of arr) {
        let newInclude = exclude + num;
        let newExclude = Math.max(include, exclude);

        include = newInclude;
        exclude = newExclude;
    }

    return Math.max(include, exclude);
}

let arr = [3, 2, 7, 10];
console.log(maxSumNonAdjacent(arr));