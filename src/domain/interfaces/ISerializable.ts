export interface ISerializable<T> {
  toJSON(): T;
}

export interface IDeserializable<T, R> {
  fromJSON(data: T): R;
}
