
const neighbors = (i, j, N) => {
  let arr = [];
  if (i - 1 > 0 && i-1 < N) arr.push([i - 1, j]);
  if (i + 1 > 0 && i+1 < N) arr.push([i + 1, j]);
  if (j - 1 > 0 && j-1 < N) arr.push([i, j - 1]);
  if (j + 1 > 0 && j+1 < N) arr.push([i, j + 1]);
  return arr;
}

const getNullCount = (arr) => {
  let c = 0
  for(let i =0; i<arr.length; i++){
    for(let j = 0; j < arr[i].length; j++) {
      if(arr[i][j] == null) c++;
    }
  }
  return c;
}

const transpose = arr => {
  for (let i = 0; i < arr.length; i++) {
     for (let j = 0; j < i; j++) {
        const tmp = arr[i][j];
        arr[i][j] = arr[j][i];
        arr[j][i] = tmp;
     };
  }
  return arr
}

function rotate(matrix) {
  const n = matrix.length;
  const x = Math.floor(n/ 2);
  const y = n - 1;
  for (let i = 0; i < x; i++) {
     for (let j = i; j < y - i; j++) {
        k = matrix[i][j];
        matrix[i][j] = matrix[y - j][i];
        matrix[y - j][i] = matrix[y - i][y - j];
        matrix[y - i][y - j] = matrix[j][y - i]
        matrix[j][y - i] = k
     }
  }
  return matrix
}

const padArray = (arr, pad) => {
  // do bottom part
  for(let i = 0; i<pad; i++){
    arr.push([]);
    for(let j = 0; j<arr[0].length; j++){
      arr[arr.length-1].push(0);
    }
  }

  // do top part
  for(let i = 0; i<pad; i++){
    arr.unshift([]);
    for(let j = 0; j<arr[arr.length-1].length; j++){
      arr[0].push(0);
    }
  }

  // do left part
  for(let i = 0; i<arr.length; i++){
    for(let j = 0; j<pad; j++){
      arr[i].unshift(0);
    }
  }

  // do right part
  for(let i = 0; i<arr.length; i++){
    for(let j = 0; j<pad; j++){
      arr[i].push(0);
    }
  }

  return arr
}

const doSwaps = (arr) => {
  let c = 0;
  for(let i = 0; i < arr.length; i++){
    for(let j = 0; j< arr.length; j++){

      let n = neighbors(i, j, arr.length);
      for(let k = 0; k< n.length; k++) {
        if(Math.random() < 0.5){
          let temp = arr[i][j];
          arr[i][j] = arr[n[k][0]][n[k][1]];
          arr[n[k][0]][n[k][1]] = temp;
          if(arr[i][j] == 1 || arr[n[k][0]][n[k][1]] == 1) c++;
        }
      }
    }
  }
  return [arr, c];
}

const doAlgo = (arr, size, source, destination) => {
  let N = size;
  let parents = [];
  let adjac = [];
  
  for (let i = 0; i<N; i++) {
    parents.push([]);
    for (let j = 0; j<N; j++) {
      parents[i].push(null);
    }
  }
  
  for (let i = 0; i<N; i++) {
    adjac.push([]);
    for (let j = 0; j<N; j++) {
      adjac[i].push(5000000);
    }
  }
  
  
  let i = source[0];
  let j = source[1];
  
  adjac[i][j] = arr[i][j];
  
  while(true){
    //console.log(getNullCount(parents))
    if(getNullCount(parents) <= 20) {
      break;
    }
    
    // run dijkstra on 2d array
    for(i = 0; i<N; i++){
      for(j = 0; j<N; j++){
        let ne = neighbors(i, j , N);
        ne.forEach(n => {
          if (adjac[n[0]][n[1]] > adjac[i][j] + arr[n[0]][n[1]]) {
            adjac[n[0]][n[1]] = adjac[i][j] + arr[n[0]][n[1]];
            parents[n[0]][n[1]] = [i, j];
          }
        })
      }
    }
  }
  
  paths = [];
  
  i = destination[0];
  j = destination[1];
  
  while(true){
    if(i == source[0] && j == source[1]) break;
    paths.push([i, j]);
    let p = parents[i][j];
    if(p == null) break
    i = p[0];
    j = p[1];
  }
  
  paths.push([source[0], source[1]]);
  
  let final = [];
  
  for (let i = 0; i<N; i++) {
    final.push([]);
    for (let j = 0; j<N; j++) {
      final[i].push(0);
    }
  }
  
  for (let i = 0; i<N; i++) {
    for (let j = 0; j<N; j++) {
      if(paths.some(p => p[0] == i && p[1] == j)){
        final[i][j] = 1;
      }
    }
  }
  
  return final
}

const getJumbled = (size) => {
  let N = size;
  
  let arr = []
  
  for (let i = 0; i<N; i++) {
    arr.push([]);
    for (let j = 0; j<N; j++) {
      if (Math.random() < 0.0) {
        arr[i].push(Math.round(Math.random() * 100) + 2);
      }
      else arr[i].push(Math.round(Math.random() * 20) + 2);
    }
  }
  
  let n = doAlgo(arr, N, [0, 0], [N-1, N-1])
  
  if(Math.random() < 0.5) {
    n = rotate(n);
  }
  
  if(Math.random() < 0.5) {
    n = transpose(n);
  }
  
  n = padArray(n, 1);
  
  for(let i = 0; i<n.length; i++){
    for(let j = 0; j<n[i].length; j++){
      if(n[i][j] == 1){
        let ne = neighbors(i, j, n.length);
        ne.forEach(item => {
          x = item[0];
          y = item[1];
          while(true){
            if(Math.random() < 0.92) break;
            if(n[x][y] == 0) {
              n[x][y] = 1;
              let pos = neighbors(x, y, n.length);
              x = pos[0][0];
              y = pos[0][1];
            }
          }
        })
      }
    }
  }
  
  let c;
  
  [n, c] = doSwaps(n);
  [n, c] = doSwaps(n);

  return [n, c];
}