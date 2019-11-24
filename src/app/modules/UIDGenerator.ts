import generate from 'nanoid/generate'

export default class UIDGenerator {
  private static MATERIALS = {
    alphaNumerical: '0123456789abcdefghijklmnopqrstuvwxyz'
  }

  public static alphaNumericUID(size: number): string {
    return generate(this.MATERIALS.alphaNumerical, size)
  }
}
